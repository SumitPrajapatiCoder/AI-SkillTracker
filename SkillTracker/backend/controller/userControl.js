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
                .map(q => {
                    const percent = ((q.correct / q.total) * 100).toFixed(1);
                    return `- Scored ${q.correct}/${q.total} (${percent}%) on ${new Date(q.date).toLocaleDateString()}`;
                })
                .join("\n");

            const avgPercent =
                quizzes.reduce((acc, q) => acc + (q.correct / q.total) * 100, 0) / quizzes.length;

            const prompt = `
You are an expert programming tutor and mentor who creates **personalized, confidence-building study planners** based on quiz performance.

The learner has taken quizzes in ${lang}. Here is their quiz history:

${historySummary}

Their average score in ${lang} is ${avgPercent.toFixed(1)}%.

Your task:

1. **Analyze their scores and learning patterns** to identify:
   - Strengths to build on
   - Weaknesses that need extra attention
   - Any repeated mistakes or patterns in performance

2. **Generate a different study planner depending on the score range**:
   - **0–39% (Beginner):** Focus on absolute fundamentals (syntax, variables, loops). Include confidence-building exercises, simple examples, and beginner-friendly resources. Build strong habits like 15–30 mins of coding daily.
   - **40–59% (Lower Intermediate):** Focus on intermediate problem areas (functions, arrays, conditionals). Suggest hands-on coding practice, guided examples, pair programming, and small but complete projects.
   - **60–79% (Upper Intermediate):** Focus on advanced concepts (OOP, debugging, optimization, error handling). Include project-based learning, real-world problem-solving challenges, and practice with slightly larger applications.
   - **80–100% (Advanced):** Focus on mastery and specialization (frameworks, algorithms, open-source contributions, building real-world projects). Recommend portfolio-driven projects, competitive programming, and advanced resources.

3. **For the detected score range, provide**:
   - **Strength & weakness analysis:** Clear breakdown of what’s working and what needs work
   - **Topics to prioritize:** Why these topics matter for skill growth
   - **Learning approaches:** Mix of theory, coding exercises, real projects, and reflection
   - **Resources:** Books, websites, video series, coding platforms, podcasts, and communities with **clickable links**
   - **Daily and weekly study routine:** Suggested time commitment, breaks, and coding/practice balance
   - **Mini-projects/challenges:** Fun, achievable projects that apply the new skills
   - **Stretch goals:** Ambitious but optional activities to push boundaries
   - **Estimated 4–6 week progressive schedule:** Weekly milestones, checkpoints, and reflection prompts
   - **Motivation boosters:** Quotes, gamification ideas, or self-reward strategies

4. **Structure the study planner with**:
   - Motivating introduction (celebrating progress, no greetings like "Hi")
   - Strengths & weaknesses analysis
   - Step-by-step study activities
   - Resource recommendations with actionable links
   - Daily & weekly planner suggestions
   - Mini-project ideas with increasing complexity
   - Stretch goals for ambitious learners
   - Weekly checkpoints and reflection questions
   - Encouraging conclusion to maintain momentum

**Tone and formatting**:
- Warm, motivating, and supportive
- Clear headings, numbered lists, and bullet points
- Avoid jargon, code snippets, or JSON
- Make it feel fully personalized, as if the planner was crafted for this learner’s unique quiz data
- Output should feel like a structured study planner, not a roadmap

Goal: Produce an actionable, motivating, and confidence-building **study planner** that guides the learner step by step in improving their ${lang} skills.
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
                .map(q => {
                    const percent = ((q.correct / q.total) * 100).toFixed(1);
                    return `- ${q.correct}/${q.total} (${percent}%) on ${new Date(q.date).toLocaleDateString()}`;
                })
                .join("\n");

            const avgPercent =
                quizzes.reduce((acc, q) => acc + (q.correct / q.total) * 100, 0) / quizzes.length;

            const prompt = `
You are an expert programming mentor AI that creates **amazing, personalized, confidence-building learning roadmaps** for users based on their quiz history and performance data.

The user has been practicing ${lang}. Here is their quiz history:

${historySummary}

Their average score in ${lang} is ${avgPercent.toFixed(1)}%.

Your task:

1. **Analyze performance trends** and current level, highlighting:
   - Areas where the user has shown strength
   - Topics where improvement is needed
   - Patterns in quiz results that can guide a tailored roadmap

2. **Generate a confidence-building roadmap** based on their current level:
   - **0–39% (Beginner)** → Start from fundamentals: syntax, variables, loops, input/output. Slow-paced, highly guided, celebrate small wins to build confidence.
   - **40–59% (Lower Intermediate)** → Strengthen problem-solving: functions, arrays, conditionals, debugging, simple projects. Show how they can create real apps and feel achievement.
   - **60–79% (Upper Intermediate)** → Advanced topics: OOP, debugging, optimization, error handling, data structures. Include project-based learning that demonstrates tangible progress.
   - **80–100% (Advanced)** → Mastery: frameworks, libraries, algorithms, real-world projects, open-source contributions, and career prep. Encourage leadership, mentorship, and portfolio visibility.

3. **For the identified roadmap level, provide**:
   - **Introduction**: Recognize achievements so far, motivate, and build confidence.
   - **Phased Roadmap**: Break learning into milestones emphasizing gradual, achievable progression.
   - **Skills/Topics per Phase**: Explain what to learn, why it matters, and estimated timelines.
   - **Resources**: Books, video tutorials, online platforms, lecture notes, communities with **clickable links**, prioritizing ${lang}-specific ones.
   - **Projects/Challenges**: Realistic, motivating projects that make the user feel accomplished.
   - **Checkpoints**: How to measure readiness for next phase, celebrating progress along the way.
   - **Career/Portfolio Guidance**: Show how they can showcase skills, build confidence in interviews, and create visible impact.

4. **Motivational guidance**:
   - Reinforce that growth is gradual but rewarding.
   - Encourage the user to celebrate every milestone.
   - Inspire consistent learning and curiosity.
   - Use empowering language throughout, not just at the start and end.

**Tone and formatting**:
- Warm, supportive, and empowering
- Headings, numbered lists, bullet points
- Avoid jargon, code, or JSON
- Make it feel as if the roadmap is **crafted specifically for this user**, directly from their quiz performance

Goal: The output should be an **amazing, motivating, structured roadmap** that makes the user feel capable, confident, and excited to learn ${lang}.
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

module.exports = { loginController, registerController, getUserInfo, updateProfileController, 
    getStudyPlans,saveStudyPlan,getRoadmaps,saveRoadmap,getUserProgress,getLanguages,getCompletedMocks,
    saveQuizResult, getMockStatus, saveMockResult,generateStudyPlan,generateRoadMap,getMockCardDetails,getQuizCardDetails };