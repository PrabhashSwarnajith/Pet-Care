# Pet Care System

A comprehensive full-stack pet care management application built with Spring Boot and React TypeScript.

## Project Overview

The Pet Care System is an integrated platform designed to manage various aspects of pet healthcare, including:
- **Pet Management**: Register and manage pet profiles
- **Appointments**: Schedule and track veterinary appointments
- **Consultations**: Book and manage vet consultations
- **Medications**: Track pet medications and prescriptions
- **Adoption Listings**: Browse and manage pet adoption listings
- **Educational Content**: Access pet care information and resources
- **Surgical Procedures**: Track surgical procedures and recovery
- **Chatbot**: AI-powered pet care assistant
- **Admin Management**: User and system administration
- **Nearby Vets**: Find veterinarians in your area

## Technology Stack

### Backend
- **Framework**: Spring Boot
- **Language**: Java
- **Authentication**: JWT (JSON Web Tokens)
- **Database**: Relational Database (configured via Docker)
- **Build Tool**: Maven
- **Container**: Docker

### Frontend
- **Framework**: React with TypeScript
- **HTTP Client**: Axios
- **Styling**: CSS
- **Build Tool**: npm/Node.js

## Project Structure

```
Pet-Care/
├── pet-care-backend/           # Spring Boot backend application
│   ├── src/main/java/com/petcare/backend/
│   │   ├── config/            # Configuration classes
│   │   ├── controller/        # REST API endpoints
│   │   ├── service/           # Business logic
│   │   ├── repository/        # Data access layer
│   │   ├── entity/            # JPA entities
│   │   ├── dto/               # Data transfer objects
│   │   └── security/          # Security components
│   ├── pom.xml                # Maven configuration
│   └── docker-compose.yml     # Docker setup
│
├── pet-care-frontend/          # React TypeScript frontend
│   ├── src/
│   │   ├── components/        # Reusable React components
│   │   ├── pages/             # Page components
│   │   ├── context/           # React context (auth, etc)
│   │   ├── api/               # API configuration
│   │   └── App.tsx            # Main app component
│   ├── public/                # Static assets
│   ├── build/                 # Production build
│   └── package.json           # npm dependencies
│
└── README.md                  # This file
```

## Getting Started

### Prerequisites
- Java 11+
- Node.js 14+
- Docker (for database)
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd pet-care-backend
```

2. Start Docker containers:
```bash
docker-compose up -d
```

3. Build and run the application:
```bash
mvn clean install
mvn spring-boot:run
```

The backend will start on `http://localhost:8080`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd pet-care-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The frontend will start on `http://localhost:3000`

## API Endpoints

The backend provides the following main endpoints:

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET/POST /api/pets` - Pet management
- `GET/POST /api/appointments` - Appointment management
- `GET/POST /api/consultations` - Consultation management
- `GET/POST /api/medications` - Medication management
- `GET/POST /api/adoption` - Adoption listings
- `GET/POST /api/education` - Educational content
- `POST /api/chatbot` - Chatbot interactions
- `GET /api/admin/users` - Admin user management

## Features

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (Admin, Vet, User)
- Protected routes and endpoints

### Core Features
- User registration and login
- Pet profile management
- Appointment scheduling
- Vet consultation booking
- Medication tracking
- Pet adoption system
- Pet health educational content
- AI chatbot for pet care advice
- User management (admin)
- Nearby veterinarian search

### User Interface
- Responsive design
- Dashboard with key metrics
- Navigation sidebar
- Rich forms for data entry
- Toast notifications
- Loading spinners

## Security

- JWT authentication for API endpoints
- Password encryption using BCrypt
- Role-based authorization
- CORS configuration
- Input validation and sanitization

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## Git Commit History

This repository follows semantic commit conventions:
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation
- `chore:` - Configuration and setup
- `build:` - Build artifacts

## License

This project is licensed under the MIT License.

## Contact & Support

For questions or support regarding this project, please refer to the project documentation files included in the repository.

---

**Last Updated**: March 2026
