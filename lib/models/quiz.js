"use strict";

module.exports = function(sequelize, DataTypes) {
  return sequelize.define( "Quiz", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isAlphanumeric: true
      }
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true
      }
    },
    data: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    options: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  });
};
