const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Library Management API',
      version: '1.0.0',
      description: 'Documented with Swagger OpenAPI 3.0'
    },
    servers: [
      {
        url: process.env.BASE_URL || 'http://localhost:5000',
        description: 'Current Environment API Server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            uid: { type: 'string', example: 'usr_abc123' },
            name: { type: 'string', example: 'Jane Smith' },
            email: { type: 'string', example: 'jane@university.edu' },
            role: { type: 'string', enum: ['student', 'librarian'], example: 'student' },
            createdAt: { type: 'string', format: 'date-time', example: '2026-03-01T12:00:00Z' }
          }
        },
        Book: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'book_doc_id_101' },
            title: { type: 'string', example: 'Introduction to Algorithms' },
            author: { type: 'string', example: 'Thomas H. Cormen' },
            isbn: { type: 'string', example: '978-0262033848' },
            category: { type: 'string', example: 'Computer Science' },
            totalCopies: { type: 'integer', example: 10 },
            availableCopies: { type: 'integer', example: 7 },
            createdAt: { type: 'string', format: 'date-time', example: '2026-03-01T12:00:00Z' }
          }
        },
        BorrowRecord: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'borrow_doc_id_999' },
            userId: { type: 'string', example: 'usr_abc123' },
            bookId: { type: 'string', example: 'book_doc_id_101' },
            bookTitle: { type: 'string', example: 'Introduction to Algorithms' },
            borrowDate: { type: 'string', format: 'date-time', example: '2026-03-01T14:00:00Z' },
            dueDate: { type: 'string', format: 'date-time', example: '2026-03-15T14:00:00Z' },
            returnDate: { type: 'string', format: 'date-time', nullable: true, example: null },
            status: { type: 'string', enum: ['borrowed', 'returned'], example: 'borrowed' }
          }
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Operation completed successfully' },
            data: { type: 'object' }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Error description message' }
          }
        },
        RegisterStudentInput: {
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            name: { type: 'string', example: 'Jane Smith' },
            email: { type: 'string', example: 'jane@university.edu' },
            password: { type: 'string', example: 'password123', minLength: 6 }
          }
        },
        RegisterLibrarianInput: {
          type: 'object',
          required: ['name', 'email', 'password', 'secretKey'],
          properties: {
            name: { type: 'string', example: 'Admin Librarian' },
            email: { type: 'string', example: 'librarian@university.edu' },
            password: { type: 'string', example: 'adminpass123', minLength: 6 },
            secretKey: { type: 'string', example: 'change_this_librarian_secret' }
          }
        },
        LoginInput: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', example: 'jane@university.edu' },
            password: { type: 'string', example: 'password123' }
          }
        },
        BookInput: {
          type: 'object',
          required: ['title', 'author', 'isbn', 'category', 'totalCopies'],
          properties: {
            title: { type: 'string', example: 'Introduction to Algorithms' },
            author: { type: 'string', example: 'Thomas H. Cormen' },
            isbn: { type: 'string', example: '978-0262033848' },
            category: { type: 'string', example: 'Computer Science' },
            totalCopies: { type: 'integer', example: 10, minimum: 0 }
          }
        }
      }
    }
  },
  apis: ['./routes/*.js']
};

module.exports = swaggerJsdoc(options);
