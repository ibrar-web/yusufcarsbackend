import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();
console.log('process.env', process.env);
export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT!, 10),
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  synchronize: true,
  logging: false,
  entities: [__dirname + '/../v1/modules/**/*.entity{.ts,.js}'],
  // migrations: ['src/migrations/*.ts'],
};

export const AppDataSource = new DataSource(dataSourceOptions);
