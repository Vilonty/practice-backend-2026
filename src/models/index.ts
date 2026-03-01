import { Sequelize } from 'sequelize';
import sequelize from '../config/database';
import User from './user';
import Room from './rooms';
import Booking from './booking';
import Review from './review';

// Инициализация связей между моделями

// User -> Booking (один пользователь - много бронирований)
User.hasMany(Booking, { 
    foreignKey: 'user_id',
    as: 'bookings' 
});
Booking.belongsTo(User, { 
    foreignKey: 'user_id',
    as: 'user' 
});

// Room -> Booking (одна комната - много бронирований)
Room.hasMany(Booking, { 
    foreignKey: 'room_id',
    as: 'bookings' 
});
Booking.belongsTo(Room, { 
    foreignKey: 'room_id',
    as: 'room' 
});

// User -> Review (один пользователь - много отзывов)
User.hasMany(Review, { 
    foreignKey: 'user_id',
    as: 'reviews' 
});
Review.belongsTo(User, { 
    foreignKey: 'user_id',
    as: 'user' 
});

// Room -> Review (одна комната - много отзывов)
Room.hasMany(Review, { 
    foreignKey: 'room_id',
    as: 'reviews' 
});
Review.belongsTo(Room, { 
    foreignKey: 'room_id',
    as: 'room' 
});

export {
    sequelize,
    User,
    Room,
    Booking,
    Review
};