// Imports
import { sequelize } from '../sequelize';
import { Model, DataTypes } from 'sequelize';

export class SupabaseToken extends Model {
  declare id: number;
  declare content: string;
  declare embedding: number[];
  declare metadata: object;
}

SupabaseToken.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    secret_key: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    is_occupied: {
      type: DataTypes.BOOLEAN, // store as text, insert as ::vector
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'SupabaseToken',
    modelName: 'SupabaseToken',
    timestamps: false,
  },
);
