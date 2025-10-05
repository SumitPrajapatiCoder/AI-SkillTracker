const mongoose = require("mongoose");
const userModel = require("../models/userModel");
const quizCardModel = require("../models/quizCardModel");
const mockCardModel = require("../models/mockCardModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);


const registerController = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const exist_user = await userModel.findOne({ email: email });
        if (exist_user) {
            return res.status(400).send({ message: 'User Already Exists', success: false });
        }

        const salt = await bcrypt.genSalt(10);
        const hashed_pass = await bcrypt.hash(password, salt);
        req.body.password = hashed_pass;

        const new_user = new userModel(req.body);
        await new_user.save();

        res.status(201).send({ message: 'Registration Successful', success: true });
    } catch (error) {
        console.log('Error From Use Control = ', error);
        res.status(500).send({ success: false, message: `Register Controller: ${error.message}` });
    }
};


const loginController = async (req, res) => {
    try {
        const { identifier, password } = req.body;

        const user = await userModel.findOne({
            $or: [{ email: identifier }, { name: identifier }],
        });

        if (!user) {
            return res.status(200).send({ message: "User Not Found", success: false });
        }

        if (user.isBlocked) {
            return res.status(200).send({ message: "Your account is blocked.", success: false });
        }

        const pass_match = await bcrypt.compare(password, user.password);
        if (!pass_match) {
            return res.status(200).send({ message: "Invalid Email/Username or Password", success: false });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: "1d",
        });

        res.status(200).send({
            message: "Login Done Successfully",
            success: true,
            token,
        });
    } catch (error) {
        console.log(error);
        res
            .status(500)
            .send({ message: `Error In Login Control ${error.message}`, success: false });
    }
};


const getUserInfo = async (req, res) => {
    try {
        const userId = req.body.userId || req.userId;

        if (!userId) {
            return res.status(400).send({ success: false, message: "User ID missing" });
        }

        const user = await userModel.findById(userId).select("-password");

        if (!user) {
            return res.status(404).send({ success: false, message: "User Not Found" });
        }

        res.status(200).send({ success: true, data: user });
    } catch (error) {
        console.error("Error in getUerInfo:", error);
        res.status(500).send({ message: "Auth Error", success: false, error });
    }
};


const updateProfileController = async (req, res) => {
    try {
        const userId = req.userId;

        const { name, email } = req.body;

        if (!name || !email) {
            return res.status(400).send({ success: false, message: "Name and Email are required" });
        }

        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).send({ success: false, message: "User not found" });
        }

        user.name = name;
        user.email = email;
        await user.save();

        const updatedUser = await userModel.findById(userId).select("-password");

        res.status(200).send({
            success: true,
            message: "Profile updated successfully",
            data: updatedUser,
        });
    } catch (error) {
        console.error("Update Profile Error:", error);
        res.status(500).send({ success: false, message: "Internal Server Error" });
    }
};


const saveQuizResult = async (req, res) => {
    try {
        const { language, correct, total, playedQuestions } = req.body;

        const user = await userModel.findById(req.userId);
        if (!user)
            return res
                .status(404)
                .json({ success: false, message: "User not found" });

        user.quizHistory.push({
            language,
            correct,
            total,
            playedQuestions, 
        });

        await user.save();
        await addNotification(user._id, `Quiz completed for ${language}. You scored ${correct}/${total}.`);


        res
            .status(200)
            .json({ success: true, message: "Quiz result saved with details" });
    } catch (error) {
        console.error("Save Result Error:", error);
        res
            .status(500)
            .json({ success: false, message: "Failed to save quiz result" });
    }
};



const saveMockResult = async (req, res) => {
    try {
        const { language, correct, total } = req.body;
        const user = await userModel.findById(req.userId);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        if (!user.mockHistory) {
            user.mockHistory = [];
        }

        user.mockHistory.push({ language, correct, total, date: new Date() });

        if (Number(correct) === Number(total)) {
            let entry = user.completedMocks.find((c) => c.language === language);
            if (entry) {
                entry.completed = true;
                entry.date = new Date();
            } else {
                user.completedMocks.push({
                    language,
                    completed: true,
                    date: new Date(),
                });
            }
        }

        await user.save();
        await addNotification(user._id, `Mock Test for ${language} completed. You scored ${correct}/${total}.`);

        if (Number(correct) === Number(total)) {
            await addNotification(user._id, `Congratulations! You achieved a perfect score in ${language} mock test. Certificate unlocked!`);
        }

        res.status(200).json({ success: true, message: "Mock result saved" });
    } catch (error) {
        console.error("Save Mock Result Error:", error);
        res.status(500).json({ success: false, message: "Failed to save mock result" });
    }
};

const getMockStatus = async (req, res) => {
    try {
        const user = await userModel.findById(req.userId);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        const language = req.params.language;

        const entry = user.completedMocks.find(
            (c) => c.language === language && c.completed === true
        );

        const disabled = !!entry; 

        res.status(200).json({ success: true, disable: disabled, date: entry ? entry.date : null });
    } catch (err) {
        console.error("Mock status error", err);
        res.status(500).json({ success: false, message: "Error checking mock status" });
    }
};


const generateStudyPlan = async (req, res) => {
    try {
        const userId = req.userId;
        const { language } = req.query;

        const user = await userModel.findById(userId).select("quizHistory studyPlans");

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if (!user.quizHistory.length) {
            return res.status(400).json({ success: false, message: "No quiz history found" });
        }

        const groupedByLanguage = user.quizHistory.reduce((acc, q) => {
            if (!acc[q.language]) acc[q.language] = [];
            acc[q.language].push(q);
            return acc;
        }, {});
        async function generatePlanForLanguage(lang, quizzes) {
            const historySummary = quizzes
                .map((q, idx) => {
                    const answersSummary = (q.playedQuestions || [])
                        .map((pq, i) => {
                            const questionText = pq.question ? pq.question.replace(/\n/g, " ") : "No question text";
                            const selected = pq.selectedAnswer || "No answer selected";
                            const correct = pq.correctAnswer || "No correct answer";
                            return `   • Q${i + 1}: "${questionText}" | User Selected Answer: "${selected}" | Correct Answer: "${correct}"`;
                        })
                        .join("\n");

                    return `• Quiz ${idx + 1} taken on ${new Date(q.date).toLocaleDateString()}:\n${answersSummary}`;
                })
                .join("\n");


            const prompt = `
You are an expert programming tutor and mentor. Based on the following user's **quiz history in ${lang}**, create a **deep, personalized study plan**. 

**User Quiz History:**
${historySummary}

**Instructions:**
- Analyze the user's answers to identify **patterns, weaknesses, and strengths**.
- Suggest **topics to focus on** and **mistakes to avoid**.
- Provide **actionable learning steps**, **mini-projects**, and **hands-on exercises** based on actual quiz questions.
- Recommend **resources** (books, websites, videos, coding platforms) for each topic.
- Include a **daily and weekly study routine**.
- Use **bullet points, numbered lists, and headings** for clarity and readability.
- Focus on **practical learning**, avoid percentages or generic labels like beginner/intermediate.
- Output should feel like a **personal mentor has analyzed the quizzes and given a plan**.

Goal: Produce an actionable, **bullet-point-based study planner** for ${lang} that is fully readable and motivating.
`;

            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
            const result = await model.generateContent([prompt]);
            return result.response.text();
        }

        if (language) {
            const quizzes = groupedByLanguage[language];
            if (!quizzes) {
                return res.status(404).json({ success: false, message: `No quiz data found for language: ${language}` });
            }
            const studyPlanText = await generatePlanForLanguage(language, quizzes);
            user.studyPlans.set(language, studyPlanText);
            await user.save();
            await addNotification(userId, `Study plan for ${language} has been generated successfully.`);
            return res.status(200).json({ success: true, language, studyPlan: studyPlanText });
        }

        for (const [lang, quizzes] of Object.entries(groupedByLanguage)) {
            if (!user.studyPlans.get(lang)) {
                const plan = await generatePlanForLanguage(lang, quizzes);
                user.studyPlans.set(lang, plan);
            }
        }
        await user.save();
        
        return res.status(200).json({
            success: true,
            studyPlansByLanguage: Object.fromEntries(user.studyPlans),
        });

    } catch (err) {
        console.error("Gemini API Error:", err);
        return res.status(500).json({
            success: false,
            message: "Failed to generate study plan",
            error: err.message,
        });
    }
};



const getStudyPlans = async (req, res) => {
    try {
        const userId = req.userId;
        const user = await userModel.findById(userId).select("studyPlans");
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        return res.status(200).json({ success: true, studyPlansByLanguage: user.studyPlans || {} });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Failed to get study plans", error: err.message });
    }
};

const saveStudyPlan = async (req, res) => {
    try {
        const userId = req.userId;
        const { language, studyPlan } = req.body;

        if (!language || !studyPlan) {
            return res.status(400).json({ success: false, message: "Language and studyPlan are required" });
        }

        const user = await userModel.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        user.studyPlans.set(language, studyPlan);
        await user.save();

        return res.status(200).json({ success: true, message: `Study plan saved for ${language}` });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Failed to save study plan", error: err.message });
    }
};


const generateRoadMap = async (req, res) => {
    try {
        const userId = req.userId;
        const { language } = req.query;

        const user = await userModel.findById(userId).select("quizHistory roadmap");
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if (!user.quizHistory.length) {
            return res.status(400).json({ success: false, message: "No quiz history found" });
        }

        const groupedByLanguage = user.quizHistory.reduce((acc, q) => {
            if (!acc[q.language]) acc[q.language] = [];
            acc[q.language].push(q);
            return acc;
        }, {});


        async function generateRoadmapForLanguage(lang, quizzes) {
            const historySummary = quizzes
                .map((q, idx) => {
                    const answersSummary = (q.playedQuestions || [])
                        .map((pq, i) => {
                            const questionText = pq.question ? pq.question.replace(/\n/g, " ") : "No question text";
                            const selected = pq.selectedAnswer || "No answer selected";
                            const correct = pq.correctAnswer || "No correct answer";
                            return `   • Q${i + 1}: "${questionText}" | User Selected Answer: "${selected}" | Correct Answer: "${correct}"`;
                        })
                        .join("\n");

                    return `• Quiz ${idx + 1} taken on ${new Date(q.date).toLocaleDateString()}:\n${answersSummary}`;
                })
                .join("\n");

            const prompt = `
You are an expert programming mentor AI. Based on the following **quiz history in ${lang}**, create a **deep, personalized, confidence-building learning roadmap**.

**User Quiz History:**
${historySummary}

**Instructions:**
- Analyze patterns in the user's quiz attempts to identify **strengths, weaknesses, and common mistakes**.
- Suggest **topics to focus on** based on actual quiz content.
- Provide a **phased learning roadmap** with **milestones**, **hands-on exercises**, and **mini-projects**.
- Include **resources**: books, videos, platforms, and communities with **clickable links**.
- Give **daily and weekly study routines** for practical progress.
- Provide **motivational guidance**: celebrate milestones, inspire curiosity and confidence.
- Structure the roadmap with **bullet points, numbered lists, and headings**.
- Avoid percentages, abstract levels, or generic labels. Focus on **practical, actionable steps**.
- Make it feel like a personal mentor analyzed the quizzes and wrote the roadmap specifically for this learner.

Goal: Output a readable, **bullet-point-based roadmap** that motivates and guides the learner in mastering ${lang}.
`;

            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
            const result = await model.generateContent([prompt]);
            return result.response.text();
        }

        if (language) {
            const quizzes = groupedByLanguage[language];
            if (!quizzes) {
                return res.status(404).json({ success: false, message: `No quiz data found for language: ${language}` });
            }
            const roadmapText = await generateRoadmapForLanguage(language, quizzes);
            user.roadmap.set(language, roadmapText);
            await user.save();
            await addNotification(userId, `Roadmap for ${language} has been generated successfully.`);
            return res.status(200).json({ success: true, language, roadmap: roadmapText });
        }

        for (const [lang, quizzes] of Object.entries(groupedByLanguage)) {
            if (!user.roadmap.get(lang)) {
                const roadmapText = await generateRoadmapForLanguage(lang, quizzes);
                user.roadmap.set(lang, roadmapText);
            }
        }
        await user.save();

        return res.status(200).json({
            success: true,
            roadmapByLanguage: Object.fromEntries(user.roadmap),
        });

    } catch (err) {
        console.error("Gemini API Error:", err);
        return res.status(500).json({
            success: false,
            message: "Failed to generate roadmap",
            error: err.message,
        });
    }
};




const getRoadmaps = async (req, res) => {
    try {
        const userId = req.userId;
        const user = await userModel.findById(userId).select("roadmap");
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        return res.status(200).json({ success: true, roadmapByLanguage: user.roadmap || {} });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Failed to get roadmaps", error: err.message });
    }
};

const saveRoadmap = async (req, res) => {
    try {
        const userId = req.userId;
        const { language, roadmap } = req.body;

        if (!language || !roadmap) {
            return res.status(400).json({ success: false, message: "Language and roadmap are required" });
        }

        const user = await userModel.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        user.roadmap.set(language, roadmap);
        await user.save();

        return res.status(200).json({ success: true, message: `Roadmap saved for ${language}` });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Failed to save roadmap", error: err.message });
    }
};


const getUserProgress = async (req, res) => {
    try {
        const userId = req.userId; 
        const user = await userModel.findById(userId).select("quizHistory");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

       
        const progress = {};
        user.quizHistory.forEach(entry => {
            if (!progress[entry.language]) {
                progress[entry.language] = { correct: 0, total: 0 };
            }
            progress[entry.language].correct += entry.correct;
            progress[entry.language].total += entry.total;
        });

        res.json({ success: true, data: progress });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};


 const getLanguages = async (req, res) => {
  try {
    const langs = await languageModel.find().sort({ name: 1 });
    res.status(200).send({ success: true, data: langs });
  } catch (error) {
    console.error("Get Languages Error:", error);
    res.status(500).send({ success: false, message: "Failed to fetch languages" });
  }
};


const getQuizCardDetails = async (req, res) => {
  try {
    const quizCards = await quizCardModel.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: quizCards });
  } catch (error) {
    console.error("Get Quiz Cards Error:", error);
    return res.status(500).json({
      error: "Failed to fetch quiz cards",
      details: error.message,
    });
  }
};

const getMockCardDetails = async (req, res) => {
  try {
    const mockCards = await mockCardModel.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: mockCards });
  } catch (error) {
    console.error("Get Mock Cards Error:", error);
    return res.status(500).json({
      error: "Failed to fetch mock cards",
      details: error.message,
    });
  }
};


const getCompletedMocks = async (req, res) => {
    try {
        const user = await userModel.findById(req.user.id);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        res.json({ success: true, data: user.completedMocks });
    } catch (error) {
        console.error("getCompletedMocks error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};


const chatbotController = async (req, res) => {
    try {
        const userId = req.user.id;
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ success: false, message: "Messages are required" });
        }

        const userMessage = messages[messages.length - 1].text
            || messages[messages.length - 1].parts?.[0]?.text;

        const user = await userModel.findById(userId).select("chatHistory");
        const history = user?.chatHistory || [];

        const recentHistory = history.slice(-20);

        let conversationContext = "";
        recentHistory.forEach(msg => {
            const speaker = msg.role === "user" ? "User" : "Gemini";
            conversationContext += `${speaker}: ${msg.text}\n`;
        });

        const formattedPrompt = `
You are a professional assistant. 
This is the conversation so far:
${conversationContext}

Now the user says: "${userMessage}"

Respond in a friendly, readable, and engaging way, like ChatGPT would. 
- Use **bold** for important terms
- Use short paragraphs for clarity
- Use bullet points or numbered lists
- Avoid markdown headings like ###
- Make it conversational and professional
- Keep it suitable for direct chat display (no raw markdown)
`;

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
        const result = await model.generateContent([{ text: formattedPrompt }]);
        const botResponse = result?.response?.text() || "No response from AI.";

        await userModel.findByIdAndUpdate(userId, {
            $push: {
                chatHistory: {
                    $each: [
                        { role: "user", text: userMessage, time: new Date() },
                        { role: "bot", text: botResponse, time: new Date() },
                    ]
                }
            }
        });

        return res.status(200).json({
            success: true,
            response: botResponse,
            timestamp: new Date().toISOString(),
        });

    } catch (error) {
        console.error("Chatbot Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to get response from AI",
            error: error.message,
        });
    }
};

const getChatHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await userModel.findById(userId).select("chatHistory");
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        return res.status(200).json({ success: true, chatHistory: user.chatHistory });
    } catch (error) {
        console.error("GetChatHistory Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch chat history",
            error: error.message,
        });
    }
};

const clearChatHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        await userModel.findByIdAndUpdate(userId, { $set: { chatHistory: [] } });
        return res.status(200).json({ success: true, message: "Chat history cleared" });
    } catch (error) {
        console.error("ClearChatHistory Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to clear chat history",
            error: error.message,
        });
    }
};



const addNotification = async (userId,message) => {
    try {
        await userModel.findByIdAndUpdate(userId, {
            $push: { notifications: { message } },
        });
    } catch (error) {
        console.error("Add Notification Error:", error);
    }
};

const getNotifications = async (req, res) => {
    try {
        const userId = req.userId;
        const user = await userModel.findById(userId).select("notifications");
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        const notifications = user.notifications.sort((a, b) => b.date - a.date);

        res.status(200).json({ success: true, notifications });
    } catch (error) {
        console.error("Get Notifications Error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch notifications" });
    }
};

const markAsRead = async (req, res) => {
    try {
        const { notificationId } = req.body;
        const userId = req.userId;

        const updated = await userModel.updateOne(
            { _id: userId, "notifications._id": notificationId },
            { $set: { "notifications.$.read": true } }
        );

        if (updated.modifiedCount === 0) {
            return res.status(404).json({ success: false, message: "Notification not found" });
        }

        res.status(200).json({ success: true, message: "Notification marked as read" });
    } catch (error) {
        console.error("Mark Notification Error:", error);
        res.status(500).json({ success: false, message: "Failed to mark notification" });
    }
};



const deleteNotification = async (req, res) => {
    try {
        const { notificationId } = req.params; 
        const userId = req.userId;

        const result = await userModel.updateOne(
            { _id: userId },
            { $pull: { notifications: { _id: notificationId } } }
        );

        if (result.modifiedCount === 0) {
            return res
                .status(404)
                .json({ success: false, message: "Notification not found" });
        }

        res.status(200).json({
            success: true,
            message: "Notification deleted successfully",
        });
    } catch (error) {
        console.error("Delete Notification Error:", error);
        res
            .status(500)
            .json({ success: false, message: "Failed to delete notification" });
    }
};


const deleteAllNotifications = async (req, res) => {
    try {
        const userId = req.userId;

        await userModel.findByIdAndUpdate(userId, { $set: { notifications: [] } });

        res.status(200).json({
            success: true,
            message: "All notifications deleted successfully",
        });
    } catch (error) {
        console.error("Delete All Notifications Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete all notifications",
        });
    }
};


module.exports = {
    loginController, registerController, getUserInfo, updateProfileController, chatbotController, getChatHistory,clearChatHistory,
    getStudyPlans,saveStudyPlan,getRoadmaps,saveRoadmap,getUserProgress,getLanguages,getCompletedMocks,
    saveQuizResult, getMockStatus, saveMockResult,generateStudyPlan,generateRoadMap,getMockCardDetails,getQuizCardDetails,
    addNotification,getNotifications,markAsRead,deleteNotification,deleteAllNotifications };