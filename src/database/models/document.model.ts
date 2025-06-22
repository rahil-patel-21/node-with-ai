// Imports
import { sequelize } from '../sequelize';
import { Model, DataTypes } from 'sequelize';

export class Document extends Model {
  declare id: number;
  declare content: string;
  declare embedding: number[];
  declare metadata: object;
}

Document.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    embedding: {
      type: DataTypes.STRING, // store as text, insert as ::vector
      allowNull: false,
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'documents',
    modelName: 'Document',
    timestamps: false,
  },
);
