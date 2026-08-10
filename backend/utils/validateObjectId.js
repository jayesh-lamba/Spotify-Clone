const mongoose = require("mongoose");

/**
 * Returns true if the given string is a valid MongoDB ObjectId.
 * @param {string} id
 * @returns {boolean}
 */
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

module.exports = isValidObjectId;
