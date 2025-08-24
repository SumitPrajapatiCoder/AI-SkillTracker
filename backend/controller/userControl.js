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
        const { language, correct, total } = req.body;

        const user = await userModel.findById(req.userId);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        user.quizHistory.push({ language, correct, total });
        await user.save();

        res.status(200).json({ success: true, message: "Quiz result saved" });
    } catch (error) {
        console.error("Save Result Error:", error);
        res.status(500).json({ success: false, message: "Failed to save quiz result" });
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
                .map(q => `- ${q.correct} out of ${q.total} on ${new Date(q.date).toLocaleDateString()}`)
                .join("\n");

            const prompt = `
You are an expert programming tutor and mentor known for creating highly effective, personalized learning plans that boost confidence and skills quickly.

Given the user’s quiz performance below for the programming language ${lang}, generate a comprehensive, engaging, and easy-to-follow study plan tailored exactly to their needs.

User quiz performance for ${lang}:
${historySummary}

In your response, include:

1. A positive, motivating introduction that acknowledges the user's progress and encourages them.
2. Clear identification of the user’s weakest areas and topics within ${lang} that need improvement.
3. Specific, prioritized topics and concepts to focus on in ${lang}, with simple explanations on why they matter.
4. Diverse, high-quality learning resources for each topic — including books, interactive websites, video courses, coding challenges, and community forums.
5. Study techniques proven to improve retention and skill mastery, such as spaced repetition, active coding, peer discussions, and building small projects.
6. A flexible, practical 4-6 week study schedule with daily or weekly goals, balanced with rest and review days.
7. Suggestions for mini-projects or challenges the user can try to solidify understanding and build portfolio-worthy work.
8. Tips on how to track progress, reflect on learning, and adjust the plan if needed.
9. An encouraging closing note to inspire continued growth and perseverance.

Make the tone warm, friendly, and empowering. Use bullet points, numbered lists, and clear headings to organize the information. Avoid technical jargon and do not output code or JSON.

Thank you!
`;

            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
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
                .map(q => `- ${q.correct} out of ${q.total} on ${new Date(q.date).toLocaleDateString()}`)
                .join("\n");

            const prompt = `
You are an expert programming mentor who creates clear, personalized, and actionable roadmaps to help learners progress effectively in their programming journey.

This roadmap should be tailored specifically for ${lang}.

Based on the user’s quiz performance for ${lang} below, generate a detailed programming roadmap tailored specifically to their current skills and areas for improvement.

User quiz performance for ${lang}:
${historySummary}

Please provide:

1. A motivating introduction that acknowledges the user’s current level for ${lang} and encourages steady progress.
2. Key programming languages, frameworks, and concepts (centered on ${lang}) the user should focus on mastering.
3. A step-by-step roadmap broken down into progressive milestones or phases (e.g., Beginner, Intermediate, Advanced).
4. For each milestone, list specific skills or topics to learn, along with brief explanations and estimated timeframes for mastering them.
5. Recommended resources for each milestone including tutorials, books, courses, and practice platforms (prioritize resources relevant to ${lang}).
6. Suggested projects or challenges that align with each milestone to reinforce learning, with project ideas specific to ${lang}.
7. Tips for maintaining consistent progress, overcoming common obstacles, and staying motivated.
8. Advice on when and how to assess readiness to move on to the next milestone (including suggested metrics or checkpoints for ${lang} skills).
9. Career and portfolio advice relevant to ${lang} (e.g., how to showcase projects, common job titles, interview prep focus).
10. A concise summary encouraging the user to commit to the roadmap and celebrating their growth potential.

Use clear headings, bullet points, and numbered lists for easy readability. Keep the tone friendly, supportive, and empowering. Do not include code or JSON in your response.

Thank you!
`;


            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
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


module.exports = { loginController, registerController, getUserInfo, updateProfileController, 
    getStudyPlans,saveStudyPlan,getRoadmaps,saveRoadmap,getUserProgress,getLanguages,
    saveQuizResult, getMockStatus, saveMockResult,generateStudyPlan,generateRoadMap,getMockCardDetails,getQuizCardDetails };