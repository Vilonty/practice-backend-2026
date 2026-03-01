import { DataTypes, Model } from "sequelize";
import sequelize from '../config/database';

interface ReviewAttributes {
    id?: number;
    room_id: number;
    user_id: number;
    rating: number;
    comment?: string | null;
    created_at?: string;
}

class Review extends Model<ReviewAttributes> implements ReviewAttributes {
    public id!: number;
    public room_id!: number;
    public user_id!: number;
    public rating!: number;
    public comment!: string | null;
    public readonly created_at!: string;
}

Review.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        room_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'rooms',
                key: 'id',
            },
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
        },
        rating: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 1,
                max: 5,
            },
        },
        comment: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: 'reviews',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: false,
        underscored: true,
        indexes: [
            {
                unique: true,
                fields: ['user_id', 'room_id'], 
            },
        ],
    }
);

export default Review;