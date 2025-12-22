# EEMS - Exam Evaluation and Management System

EEMS is a comprehensive web-based platform designed to streamline the exam creation, administration, and grading process for educational institutions. The system provides a seamless experience for instructors, students, and graders with role-based access control.

## Features

### For Instructors
- Create and manage exams with various question types (MCQ, True/False, Numeric, Short Answer)
- Set exam duration, total marks, and scheduling
- Publish exams and monitor student submissions
- View and analyze exam results

### For Students
- Take timed exams in a secure environment
- View exam results and feedback
- Track exam history

### For Graders
- Grade subjective answers
- Provide feedback on student submissions
- Manage grading workload

## Tech Stack

### Frontend
- React 18
- React Router v6
- CSS Modules
- Axios for API communication

### Backend
- Node.js with Express
- PostgreSQL Database
- JWT Authentication
- RESTful API

### Testing
- Jest
- React Testing Library
- Supertest

## Quick Setup (Local Development)

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm (v8 or higher) or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/teem-eems-g2/eems.git
   cd eems
   ```

2. **Set up the database**
   - Create a new PostgreSQL database
   - Run the schema script:
     ```bash
     psql -U postgres -f database/schema.sql
     ```

3. **Configure environment variables**
   Create `.env` files in both frontend and backend directories with the required environment variables.

4. **Install dependencies**
   ```bash
   # Install backend dependencies
   cd backend
   npm install
   
   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

### Running the Application

1. **Start the backend server**
   ```bash
   cd backend
   npm start
   ```
   Server runs on: http://localhost:5000

2. **Start the frontend development server**
   ```bash
   cd frontend
   npm start
   ```
   App runs on: http://localhost:3000

## Project Structure

```
eems/
├── backend/               # Backend server code
│   ├── config/           # Configuration files
│   ├── models/           # Database models
│   ├── routes/           # API routes
│   └── server.js         # Main server file
│
├── frontend/             # Frontend React application
│   ├── public/           # Static files
│   └── src/
│       ├── components/   # React components
│       ├── services/     # API services
│       └── App.js        # Main React component
│
├── database/             # Database schema and migrations
│   └── schema.sql        # Database schema
│
└── tests/                # Test files
    ├── backend/         # Backend tests
    └── frontend/        # Frontend tests
```

## API Documentation

The API documentation is available at `/api-docs` when the backend server is running.

## Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

## Team Members

| Name | Role | Student ID |
| :--- | :--- | :--- |
| **Solomon Fentaw** | Project Manager | ugr/188697/16 |
| **Sofani Gidey** | Lead Developer | ugr/189995/16 |
| **Samrawit Asmelash** | QA/Testing Lead | ugr/188625/16 |
| **Aynalem Atsbeha** | Documentation Lead | ugr/189510/16 |
| **Yoseph Hadush Tela** | Backend Developer | ugr/188832/16 |
| **Gidena Mehari** | Frontend Developer | ugr/188188/16 |
| **Haftu Moges** | Database Engineer | ugr/188225/16 |

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Hat tip to anyone whose code was used
- Inspiration
- etc.
