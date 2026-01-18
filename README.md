# Mindo Stack - MERN Application

A full-stack MERN (MongoDB, Express, React, Node.js) application.

## Stack

- **MongoDB**: Database
- **Express**: Backend framework
- **React**: Frontend library (with Vite)
- **Node.js**: Runtime environment

## Project Structure

```
Mindo-Stack/
├── client/              # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
├── server/              # Express backend
│   ├── models/
│   ├── routes/
│   ├── server.js
│   └── package.json
└── package.json         # Root package.json
```

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

## Installation

1. Install all dependencies:
```bash
npm run install-all
```

Or install manually:
```bash
# Install root dependencies
npm install

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

## Configuration

1. Create a `.env` file in the `server/` directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/mindostack
NODE_ENV=development
```

2. Update the MongoDB URI with your connection string (local or MongoDB Atlas)

## Running the Application

### Development Mode (both client and server)
```bash
npm run dev
```

### Run Client Only
```bash
npm run client
```

### Run Server Only
```bash
npm run server
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## API Endpoints

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## Features

- Full CRUD operations for users
- MongoDB database integration
- RESTful API
- React frontend with axios for API calls
- Proxy configuration for seamless frontend-backend communication
- Error handling

## Development

- Frontend runs on port 3000 (React development server)
- Backend runs on port 5000 (Express server)
- MongoDB runs on default port 27017 (or your configured port)

## Technologies Used

### Backend
- Express.js
- MongoDB with Mongoose
- CORS
- dotenv

### Frontend
- React 18
- Vite (Fast build tool and dev server)
- Axios
- React Router DOM (ready to use)

## License

ISC
