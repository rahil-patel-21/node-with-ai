// Imports
import { Sequelize } from 'sequelize';
import { Env } from 'src/constants/Env';

export const sequelize = new Sequelize(
  'postgres', // DB name
  Env.database.postgres.username, // Username
  Env.database.postgres.password, // Password
  {
    host: Env.database.postgres.host, // Host
    dialect: 'postgres',
    logging: false,
  },
);
