import { DataTypes, Model } from "sequelize";
import sequelize from '../config/database';

interface RoomAttributes {
    id?: number;
    name: string;
    room_number: string;
    room_type: 'standard' | 'deluxe' | 'suite' | 'family';
    capacity: number;
    has_air_conditioner?: boolean;
    description?: string | null;
    is_active?: boolean;
}

class Room extends Model<RoomAttributes> implements RoomAttributes {
    public id!: number;
    public name!: string;
    public room_number!: string;
    public room_type!: 'standard' | 'deluxe' | 'suite' | 'family';
    public capacity!: number;
    public has_air_conditioner!: boolean;
    public description!: string | null;
    public is_active!: boolean;
}

Room.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        room_number: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false,
        },
        room_type: {
            type: DataTypes.ENUM('standard', 'deluxe', 'suite', 'family'),
            allowNull: false,
            defaultValue: 'standard',
        },
        capacity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 1,
            },
        },
        has_air_conditioner: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
    },
    {
        sequelize,
        tableName: 'rooms',
        timestamps: false,
        underscored: true,
    }
);

export default Room;