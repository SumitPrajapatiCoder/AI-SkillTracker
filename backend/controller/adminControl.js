const quizModel = require("../models/quizModel");
const mockModel = require("../models/mockModel");
const userModel = require("../models/userModel");



// const OpenAI = require("openai");
// const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// const generateAIQuestion = async (req, res) => {
//     const { language, difficulty } = req.body;

//     if (!language || !difficulty) {
//         return res.status(400).json({ success: false, message: "Language and difficulty required" });
//     }

//     const prompt = `Generate one ${difficulty} level multiple-choice programming question in ${language}. 
// It should have 4 options and clearly mention the correct answer.
// Respond strictly in JSON format:
// {
//   "question": "Your question here?",
//   "options": ["A", "B", "C", "D"],
//   "correctAnswer": "Correct option exactly as in options"
// }`;

//     try {
//         const chatCompletion = await openai.chat.completions.create({
//             model: "gpt-3.5-turbo",
//             messages: [{ role: "user", content: prompt }],
//         });

//         const text = chatCompletion.choices[0].message.content;

//         console.log("AI Response:", text);

//         const parsed = JSON.parse(text);

//         return res.status(200).json({ success: true, data: parsed });
//     } catch (err) {
//         console.error("OpenAI Error:", err);
//         return res.status(500).json({
//             success: false,
//             message: "Failed to generate question",
//             error: err.message,
//         });
//     }
// };







// const { GoogleGenerativeAI } = require("@google/generative-ai");
// const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// const generateAIQuestion = async (req, res) => {
//   try {
//     const { language, difficulty } = req.body;

//     if (!language || !difficulty) {
//       return res.status(400).json({
//         success: false,
//         message: "Language and difficulty are required",
//       });
//     }

//     const prompt = `
// Generate a UNIQUE ${difficulty} level multiple-choice programming question in ${language}.
// Make sure it's **different** from any previous question.
// It should have:
// - A creative and distinct question
// - Exactly 4 options
// - A clearly marked correct answer
// Respond STRICTLY in JSON format like:
// {
//   "question": "Your question here?",
//   "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
//   "correctAnswer": "Correct option exactly as in the options"
// }`;

//     const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

//     const result = await model.generateContent([prompt]);
//     const text = result.response.text();

//     const match = text.match(/\{[\s\S]*\}/);
//     if (!match) {
//       return res.status(500).json({
//         success: false,
//         message: "Failed to extract JSON from AI response",
//         raw: text,
//       });
//     }

//     let parsed;
//     try {
//       parsed = JSON.parse(match[0]);
//     } catch (e) {
//       return res.status(500).json({
//         success: false,
//         message: "Failed to parse extracted JSON",
//         raw: match[0],
//       });
//     }

//     return res.status(200).json({ success: true, data: parsed });

//   } catch (err) {
//     console.error("Gemini API Error:", err);
//     if (err.message.includes("429")) {
//       return res.status(429).json({
//         success: false,
//         message: "Gemini API quota limit exceeded. Try again later.",
//         error: err.message,
//       });
//     }

//     return res.status(500).json({
//       success: false,
//       message: "Gemini generation failed",
//       error: err.message,
//     });
//   }
// };






const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

const generateAIQuestion = async (req, res) => {
  try {
    const { language, difficulty, type } = req.body;

    if (!language || !difficulty || !["quiz", "mock"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Language, difficulty, and valid type are required",
      });
    }

    const Model = type === "quiz" ? quizModel : mockModel;

    const existing = await Model.find({ language, difficulty }).select("question -_id").lean();
    const existingQuestions = existing.map(q => q.question).slice(0, 10); 

    const avoidList = existingQuestions.length
      ? `Avoid these existing questions:\n- ${existingQuestions.join("\n- ")}\n\n`
      : "";


    const prompt = `
${avoidList}
Now generate a UNIQUE ${difficulty} level multiple-choice programming question in ${language}.

The question **must** be based on a short code snippet and ask the user to predict the output or behavior of the code.

Strictly respond in valid **JSON** format like:
{
  "question": "What will be the output of the following ${language} code?\n<insert code here>",
  "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
  "correctAnswer": "Correct option exactly as in the options"
}

Make sure:
- The question includes a short complete code snippet.
- All options are plausible.
- Do NOT return any explanation or markdown formatting — only raw JSON.
`;


    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent([prompt]);
    const text = result.response.text();

    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      return res.status(500).json({
        success: false,
        message: "Failed to extract JSON from AI response",
        raw: text,
      });
    }

    let parsed;
    try {
      parsed = JSON.parse(match[0]);
    } catch (e) {
      return res.status(500).json({
        success: false,
        message: "Failed to parse extracted JSON",
        raw: match[0],
      });
    }
    const duplicate = await Model.findOne({ question: parsed.question });
    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: "Generated question already exists. Try again.",
      });
    }

    return res.status(200).json({ success: true, data: parsed });

  } catch (err) {
    console.error("Gemini API Error:", err);
    if (err.message.includes("429")) {
      return res.status(429).json({
        success: false,
        message: "Gemini API quota exceeded",
        error: err.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Gemini generation failed",
      error: err.message,
    });
  }
};




const uploadQuestion = async (req, res) => {
    try {
        const { type, question, options, correctAnswer, language,difficulty } = req.body;

        if (!type || !["quiz", "mock"].includes(type)) {
            return res.status(400).send({ success: false, message: "Invalid type" });
        }

        if (!["Easy", "Medium", "Hard"].includes(difficulty)) {
            return res.status(400).send({ success: false, message: "Invalid difficulty" });
        }
        const Model = type === "quiz" ? quizModel : mockModel;

        const newQuestion = new Model({
            question,
            options,
            correctAnswer,
            language,
            difficulty, 
            createdBy: req.userId
        });

        await newQuestion.save();
        res.status(201).send({ success: true, message: `${type} question uploaded` });
    } catch (error) {
        console.log("Upload Error:", error);
        res.status(500).send({ success: false, message: "Upload failed" });
    }
};


const deleteQuestion = async (req, res) => {
    try {
        const { id } = req.params;
        const { type } = req.query;

        if (!id || !type || !["quiz", "mock"].includes(type)) {
            return res.status(400).send({ success: false, message: "Invalid ID or type" });
        }

        const Model = type === "quiz" ? quizModel : mockModel;
        const deleted = await Model.findByIdAndDelete(id);

        if (!deleted) {
            return res.status(404).send({ success: false, message: "Question not found" });
        }

        res.status(200).send({ success: true, message: "Question deleted" });
    } catch (error) {
        console.log("Delete Error:", error);
        res.status(500).send({ success: false, message: "Delete failed" });
    }
};


const editQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.query;

    if (!id || !type || !["quiz", "mock"].includes(type)) {
      return res.status(400).send({ success: false, message: "Invalid ID or type" });
    }

    const updateData = req.body;
    const Model = type === "quiz" ? quizModel : mockModel;

    const updatedQuestion = await Model.findByIdAndUpdate(id, updateData, { new: true });

    if (!updatedQuestion) {
      return res.status(404).send({ success: false, message: "Question not found" });
    }

    res.status(200).send({ success: true, message: "Question updated", data: updatedQuestion });
  } catch (error) {
    console.error("Edit Error:", error);
    res.status(500).send({ success: false, message: "Update failed" });
  }
};



const listAllQuestions = async (req, res) => {
  try {
    const { type, search, language } = req.query;

    if (!type || !["quiz", "mock"].includes(type)) {
      return res.status(400).send({ success: false, message: "Invalid type" });
    }

    const Model = type === "quiz" ? quizModel : mockModel;
    const query = {};

    if (search) {
      query.$or = [
        { question: { $regex: search, $options: "i" } },
        { language: { $regex: search, $options: "i" } }
      ];
    }

    if (language && language !== "all") {
      query.language = { $regex: `^${language}$`, $options: "i" };
    }

    const questions = await Model.find(query);
    res.status(200).send({ success: true, data: questions });
  } catch (error) {
    console.log("List Error:", error);
    res.status(500).send({ success: false, message: "Failed to fetch questions" });
  }
};



const listAllUsers = async (req, res) => {
    try {
        const users = await userModel.find().select("-password");
        res.status(200).send({ success: true, data: users });
    } catch (error) {
        console.log("User List Error:", error);
        res.status(500).send({ success: false, message: "Failed to fetch users" });
    }
};


const blockUser = async (req, res) => {
  try {
    await userModel.findByIdAndUpdate(req.params.id, { isBlocked: true });
    res.status(200).send({ success: true, message: "User blocked successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, message: "Failed to block user" });
  }
};

const unblockUser = async (req, res) => {
  try {
    await userModel.findByIdAndUpdate(req.params.id, { isBlocked: false });
    res.status(200).send({ success: true, message: "User unblocked successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, message: "Failed to unblock user" });
  }
};

const deleteUser = async (req, res) => {
  try {
    await userModel.findByIdAndDelete(req.params.id);
    res.status(200).send({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, message: "Failed to delete user" });
  }
};


const toggleAdminRole = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await userModel.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user._id.toString() === req.userId) {
      return res.status(400).json({
        success: false,
        message: "You cannot change your own admin status"
      });
    }


    user.isAdmin = !user.isAdmin;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User is now ${user.isAdmin ? "an Admin" : "a regular user"}`,
      user,
    });
  } catch (error) {
    console.error("Error toggling admin:", error);
    res.status(500).json({ success: false, message: "Server error while toggling admin" });
  }
};

module.exports = {
    uploadQuestion,
    deleteQuestion,
    listAllQuestions,
    listAllUsers,
    generateAIQuestion,
    editQuestion,
    blockUser,unblockUser,deleteUser,toggleAdminRole
};
