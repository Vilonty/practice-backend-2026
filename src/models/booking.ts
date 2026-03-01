import { DataTypes, Model } from "sequelize";
import sequelize from '../config/database';

interface BookingAttributes {
    id?: number;
    user_id: number;
    room_id: number;
    date: string;
    start_time: string;
    end_time: string;
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
    created_at?: string;
    updated_at?: string;
}

class Booking extends Model<BookingAttributes> implements BookingAttributes {
    public id!: number;
    public user_id!: number;
    public room_id!: number;
    public date!: string;
    public start_time!: string;
    public end_time!: string;
    public status!: 'pending' | 'confirmed' | 'cancelled' | 'completed';
    public readonly created_at!: string;
    public readonly updated_at!: string;
}

Booking.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
        },
        room_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'rooms',
                key: 'id',
            },
        },
        date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        start_time: {
            type: DataTypes.TIME,
            allowNull: false,
        },
        end_time: {
            type: DataTypes.TIME,
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM('pending', 'confirmed', 'cancelled', 'completed'),
            defaultValue: 'pending',
        },
    },
    {
        sequelize,
        tableName: 'bookings',
        timestamps: true,
        underscored: true,
    }
);

export default Booking;