
# EEMS – Electronic Exam Marking System

EEMS is a comprehensive **web-based platform** designed to streamline the **exam creation, administration, and grading process** for educational institutions.  
The system provides a seamless experience for **instructors, students, and graders** with **role-based access control**.

---

## Features

### For Instructors
- Create and manage exams with multiple question types (MCQ, True/False, Numeric, Short Answer)
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

---

## Tech Stack

### Frontend
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![React Router](https://img.shields.io/badge/React_Router-v6-CA4245?logo=react-router&logoColor=white)
![CSS Modules](https://img.shields.io/badge/CSS_Modules-blue?logo=css3&logoColor=white)
![Axios](https://img.shields.io/badge/Axios-5A29E4?logo=axios&logoColor=white)

### Backend
![Node.js](https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-Authentication-000000?logo=jsonwebtokens&logoColor=white)
![REST API](https://img.shields.io/badge/REST-API-02569B)

### Testing
![Jest](https://img.shields.io/badge/Jest-C21325?logo=jest&logoColor=white)
![React Testing Library](https://img.shields.io/badge/React_Testing_Library-E33332?logo=testing-library&logoColor=white)
![Supertest](https://img.shields.io/badge/Supertest-333333)

---

## Quick Setup (Local Development)

### Prerequisites
![Node.js](https://img.shields.io/badge/Node.js-v16+-339933?logo=node.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-v12+-4169E1?logo=postgresql&logoColor=white)
![npm](https://img.shields.io/badge/npm-v8+-CB3837?logo=npm&logoColor=white)

---

## Installation

### 1. Clone the Repository
```bash
git clone https://github.com/teem-eems-g2/eems.git
cd eems
````

### 2. Database Setup

```bash
psql -U postgres -f database/schema.sql
```

### 3. Environment Configuration

Create `.env` files in both **backend** and **frontend** directories and add the required environment variables.

### 4. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

---

## Running the Application

### Backend Server

```bash
cd backend
npm start
```

Server runs on: **[http://localhost:5000](http://localhost:5000)**

### Frontend Server

```bash
cd frontend
npm start
```

Application runs on: **[http://localhost:3000](http://localhost:3000)**

---

## Project Structure

```
eems/
├── backend/
│   ├── config/
│   ├── models/
│   ├── routes/
│   └── server.js
│
├── frontend/
│   ├── public/
│   └── src/
│       ├── components/
│       ├── services/
│       └── App.js
│
├── database/
│   └── schema.sql
│
└── tests/
    ├── backend/
    └── frontend/
```

---

## API Documentation

Available at:

```
http://localhost:5000/api-docs
```

---

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

---

## Team Members

| Name               | Role               | Student ID    |
| ------------------ | ------------------ | ------------- |
| Solomon Fentaw     | Project Manager    | UGR/188697/16 |
| Sofani Gidey       | Lead Developer     | UGR/189995/16 |
| Samrawit Asmelash  | QA / Testing Lead  | UGR/188625/16 |
| Aynalem Atsbeha    | Documentation Lead | UGR/189510/16 |
| Yoseph Hadush Tela | Backend Developer  | UGR/188832/16 |
| Gidena Mehari      | Frontend Developer | UGR/188188/16 |
| Haftu Moges        | Database Engineer  | UGR/188225/16 |

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/YourFeature`)
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

## License

This project is licensed under the **MIT License**.

---

## Acknowledgments

* Software Engineering Course Instructors
* Open-source community
* Project contributors

