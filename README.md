# AI Based SkillTracker 🚀

A comprehensive platform designed to help users assess and improve their technical skills through quizzes, mock tests, and personalized learning paths. SkillTracker aims to provide a seamless and engaging experience for developers looking to enhance their knowledge and prepare for technical interviews. It offers features like AI-powered question generation, user progress tracking, and a supportive community.

## 🌟 Key Features

- **User Authentication & Authorization:** Secure user registration and login with JWT-based authentication.
- **Skill Assessment:** Take quizzes and mock tests in various programming languages.
- **Personalized Learning Paths:** Generate customized study plans and roadmaps.
- **AI-Powered Question Generation:** Admins can generate quiz questions using Google's Generative AI.
- **Progress Tracking:** Monitor your progress and identify areas for improvement.
- **Admin Dashboard:** Manage users, questions, contests, and languages.
- **Notification System:** Stay updated with important announcements and personalized notifications.
- **Contest Platform:** Participate in coding contests and track your performance on leaderboards.
- **Profile Management:** Update your profile information, including skills and profile picture.
- **Chatbot Integration:** Get instant help and guidance from the integrated chatbot.

## 🛠️ Tech Stack

- **Frontend:**
    - React
    - React Router DOM
    - Axios
    - React Icons
    - React Toastify
    - SweetAlert2
    - CSS
- **Backend:**
    - Node.js
    - Express.js
    - Mongoose
    - JSON Web Tokens (JWT)
    - bcryptjs
    - Cors
    - Morgan
    - Colors
    - dotenv
    - Google Generative AI (@google/generative-ai)
- **Database:**
    - MongoDB
- **Cloud Storage:**
    - Cloudinary
- **Other:**
    - Multer
    - Multer Storage Cloudinary

## 📦 Getting Started

Follow these instructions to get the project up and running on your local machine.

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- MongoDB installed and running
- Cloudinary account
- Google Generative AI API Key

### Installation

1.  **Clone the repository:**

    ```bash
    git clone <repository_url>
    cd SkillTracker
    ```

2.  **Install backend dependencies:**

    ```bash
    cd backend
    npm install
    ```

3.  **Configure backend environment variables:**

    Create a `.env` file in the `backend` directory and add the following:

    ```
    MONGO_URI=<your_mongodb_connection_string>
    PORT=5000
    JWT_SECRET=<your_jwt_secret>
    CLOUDINARY_NAME=<your_cloudinary_cloud_name>
    CLOUDINARY_API_KEY=<your_cloudinary_api_key>
    CLOUDINARY_API_SECRET=<your_cloudinary_api_secret>
    GOOGLE_API_KEY=<your_google_generative_ai_api_key>
    ```

4.  **Install frontend dependencies:**

    ```bash
    cd ../frontend
    npm install
    ```

5.  **Configure frontend environment variables:**

    Create a `.env` file in the `frontend` directory and add the following:

    ```
    VITE_API_URL=http://localhost:5000/api/v1
    ```

### Running Locally

1.  **Start the backend server:**

    ```bash
    cd backend
    npm run server
    ```

2.  **Start the frontend development server:**

    ```bash
    cd ../frontend
    npm run dev
    ```

    The frontend application will be accessible at `http://localhost:5173`.

## 💻 Usage

1.  **Register a new user account or log in with an existing account.**
2.  **Explore the available quizzes and mock tests for different programming languages.**
3.  **Generate personalized study plans and roadmaps to guide your learning.**
4.  **Track your progress and identify areas where you need to improve.**
5.  **Participate in coding contests and compete with other users.**
6.  **Use the chatbot for instant help and guidance.**
7.  **Customize your profile and manage your notifications.**
8.  **Administrators can access the admin dashboard to manage users, questions, contests, and languages.**

## 📂 Project Structure

```
SkillTracker/
├── backend/
│   ├── config/
│   │   ├── cloudinary.js      # Cloudinary configuration
│   │   ├── db.js             # Database connection
│   ├── controller/
│   │   ├── adminControl.js    # Admin controllers
│   │   ├── quizControl.js     # Quiz controllers
│   │   ├── userControl.js     # User controllers
│   ├── middleware/
│   │   ├── adminMiddleware.js # Admin authorization middleware
│   │   ├── authMiddleware.js  # Authentication middleware
│   ├── models/
│   │   ├── contestModel.js    # Contest model
│   │   ├── languageModel.js   # Language model
│   │   ├── mockModel.js       # Mock test model
│   │   ├── quizModel.js       # Quiz model
│   │   ├── userModel.js       # User model
│   ├── routes/
│   │   ├── adminRoute.js      # Admin routes
│   │   ├── quizRoute.js       # Quiz routes
│   │   ├── userRoute.js       # User routes
│   ├── server.js              # Main server file
├── frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── pages/            # Page components
│   │   ├── routes/           # Custom route components
│   │   ├── App.jsx           # Main application component
│   │   ├── main.jsx          # Entry point for the React application
├── .env                     # Environment variables
├── README.md                # Project documentation
```

## 📸 Screenshots

<img width="1348" height="608" alt="image" src="https://github.com/user-attachments/assets/ee830731-0f42-4603-a04f-d7b10be05849" />
<img width="866" height="541" alt="image" src="https://github.com/user-attachments/assets/e55a2891-06c7-49b8-bda9-0692bc0c9e6c" />
<img width="1049" height="544" alt="image" src="https://github.com/user-attachments/assets/aaa2a59d-96b0-4610-8942-c1ede32cb4c3" />
<img width="465" height="558" alt="image" src="https://github.com/user-attachments/assets/116b6669-1f2d-4ab2-b51a-6aeb5584145b" />


