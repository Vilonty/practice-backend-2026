import { DataTypes, Model } from "sequelize";
import sequelize from '../config/database';

interface UserAttributes {
    id?: number;              
    email: string;
    password_hash: string;
    name: string;
    role: 'user' | 'admin';
    created_at?: string;      
}

class User extends Model<UserAttributes> implements UserAttributes {
    public id!: number;
    public email!: string;
    public password_hash!: string;
    public name!: string;
    public role!: 'user' | 'admin';
    public readonly created_at!: string;


    public toJSON() {
        const values = { ...this.get() } as Partial<UserAttributes>;
        delete values.password_hash;
        return values;
    }
}

User.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        email: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false,
            validate: {
                isEmail: true,
            },
        },
        password_hash: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        role: {
            type: DataTypes.ENUM('user', 'admin'),
            defaultValue: 'user',
        },
    },
    {
        sequelize,
        tableName: 'users',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: false,
        underscored: true,
    }
);

export default User;