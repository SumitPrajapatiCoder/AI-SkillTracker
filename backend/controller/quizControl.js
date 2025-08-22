const quizModel = require("../models/quizModel");
const mockModel = require("../models/mockModel")


const getQuizByLanguage = async (req, res) => {
    try {
        const { language } = req.params;

        const questions = await quizModel.aggregate([
            { $match: { language } },
            { $sample: { size: 20 } } 
        ]);

        res.status(200).json({ success: true, data: questions });
    } catch (error) {
        console.error("Quiz Fetch Error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch quiz questions" });
    }
};



const getMockByLanguage = async (req, res) => {
    try {
        const { language } = req.params;

        const questions = await mockModel.aggregate([
            { $match: { language } },
            { $sample: { size: 20 } }
        ]);

        res.status(200).json({ success: true, data: questions });
    } catch (error) {
        console.error("Quiz Fetch Error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch quiz questions" });
    }
};

module.exports={ getQuizByLanguage,getMockByLanguage }