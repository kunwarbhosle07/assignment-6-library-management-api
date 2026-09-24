const verifyStudent = (req, res, next) => {
  if (!req.user || req.user.role !== 'student') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: Access restricted to students only.'
    });
  }
  next();
};

const verifyLibrarian = (req, res, next) => {
  if (!req.user || req.user.role !== 'librarian') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: Access restricted to librarians only.'
    });
  }
  next();
};

module.exports = {
  verifyStudent,
  verifyLibrarian
};
