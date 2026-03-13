import { Op, WhereOptions } from 'sequelize';
import Booking from '../models/booking';
import Room from '../models/rooms';
import User from '../models/user';
import { AppError } from '../middleware/error.middleware';
import logger from '../utils/logger';

interface BookingFilters {
  status?: string;
  fromDate?: string;
  toDate?: string;
  roomId?: number;
  userId?: number;
}

class BookingService {
  
   // Проверка доступности комнаты на указанное время 
  async isRoomAvailable(
    roomId: number, 
    date: string, 
    startTime: string, 
    endTime: string, 
    excludeBookingId?: number
  ): Promise<boolean> {
    const whereClause: WhereOptions = {
      room_id: roomId,
      date: date,
      status: { [Op.in]: ['confirmed', 'pending'] },
      [Op.and]: [
        { start_time: { [Op.lt]: endTime } },
        { end_time: { [Op.gt]: startTime } }
      ]
    };

    // Исключаем текущее бронирование при обновлении
    if (excludeBookingId) {
      whereClause.id = { [Op.ne]: excludeBookingId };
    }

    const conflictingBooking = await Booking.findOne({ where: whereClause });
    
    return !conflictingBooking;
  }

 
   // Создание бронирования (Happy Path + защита)
 
  async createBooking(
    userId: number,
    roomId: number,
    date: string,
    startTime: string,
    endTime: string
  ): Promise<Booking> {
    const room = await Room.findByPk(roomId);
    if (!room) {
      logger.warn('Создание бронирования: комната не найдена', { userId, roomId });
      throw new AppError('Комната не найдена', 404);
    }

    if (!room.is_active) {
      logger.warn('Создание бронирования: комната неактивна', { userId, roomId });
      throw new AppError('Комната недоступна для бронирования', 400);
    }

    if (startTime >= endTime) {
      logger.warn('Создание бронирования: некорректный интервал', { userId, startTime, endTime });
      throw new AppError('Время начала должно быть раньше времени окончания', 400);
    }

    const bookingDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (bookingDate < today) {
      logger.warn('Создание бронирования: дата в прошлом', { userId, date });
      throw new AppError('Нельзя создать бронирование на прошедшую дату', 400);
    }

    const isAvailable = await this.isRoomAvailable(roomId, date, startTime, endTime);
    if (!isAvailable) {
      logger.warn('Создание бронирования: конфликт интервалов', { 
        userId, 
        roomId, 
        date,
        startTime, 
        endTime 
      });
      throw new AppError('Комната уже забронирована на указанное время', 409);
    }

    const booking = await Booking.create({
      user_id: userId,
      room_id: roomId,
      date,
      start_time: startTime,
      end_time: endTime,
      status: 'confirmed' 
    });

    logger.info('Бронирование создано', {
      bookingId: booking.id,
      userId,
      roomId,
      date,
      startTime,
      endTime
    });

    return booking;
  }


   // Отмена бронирования

  async cancelBooking(bookingId: number, userId: number, isAdmin: boolean = false): Promise<Booking> {
    const booking = await Booking.findByPk(bookingId);
    if (!booking) {
      logger.warn('Отмена бронирования: бронь не найдена', { bookingId, userId });
      throw new AppError('Бронирование не найдено', 404);
    }

    if (!isAdmin && booking.user_id !== userId) {
      logger.warn('Отмена бронирования: доступ запрещен', { 
        bookingId, 
        userId, 
        ownerId: booking.user_id 
      });
      throw new AppError('У вас нет прав на отмену этого бронирования', 403);
    }

    if (booking.status === 'cancelled') {
      logger.warn('Отмена бронирования: уже отменено', { bookingId });
      throw new AppError('Бронирование уже отменено', 400);
    }

    if (booking.status === 'completed') {
      logger.warn('Отмена бронирования: нельзя отменить завершенное', { bookingId });
      throw new AppError('Нельзя отменить завершенное бронирование', 400);
    }

    const bookingDate = new Date(booking.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (!isAdmin && bookingDate < today) {
      logger.warn('Отмена бронирования: дата уже прошла', { bookingId, date: booking.date });
      throw new AppError('Нельзя отменить бронирование после даты заезда', 400);
    }

    if (!isAdmin) {
      const msInDay = 24 * 60 * 60 * 1000;
      const timeUntilBooking = bookingDate.getTime() - today.getTime();
      const daysUntilBooking = timeUntilBooking / msInDay;
      
      if (daysUntilBooking < 1) {
        logger.warn('Отмена бронирования: менее 24 часов до даты', { 
          bookingId, 
          daysUntilBooking 
        });
        throw new AppError('Отмена возможна не менее чем за 24 часа до даты заезда', 400);
      }
    }

    await booking.update({
      status: 'cancelled'
    });

    logger.info('Бронирование отменено', {
      bookingId,
      userId,
      isAdmin,
      status: 'cancelled'
    });

    return booking;
  }


   // Получение бронирований пользователя
 
  async getUserBookings(userId: number, filters: BookingFilters = {}): Promise<Booking[]> {
    const whereClause: WhereOptions = { user_id: userId };

    if (filters.status) {
      whereClause.status = filters.status;
    }

    if (filters.fromDate) {
      whereClause.date = { [Op.gte]: filters.fromDate };
    }

    if (filters.toDate) {
      whereClause.date = { ...whereClause.date, [Op.lte]: filters.toDate };
    }

    const bookings = await Booking.findAll({
      where: whereClause,
      include: [{
        model: Room,
        attributes: ['id', 'name', 'room_number', 'room_type', 'capacity']
      }],
      order: [['date', 'DESC'], ['start_time', 'ASC']]
    });

    return bookings;
  }


   // Получение всех бронирований (для админа)
 
  async getAllBookings(filters: BookingFilters = {}): Promise<Booking[]> {
    const whereClause: WhereOptions = {};

    if (filters.status) {
      whereClause.status = filters.status;
    }
    if (filters.roomId) {
      whereClause.room_id = filters.roomId;
    }
    if (filters.userId) {
      whereClause.user_id = filters.userId;
    }
    if (filters.fromDate) {
      whereClause.date = { [Op.gte]: filters.fromDate };
    }
    if (filters.toDate) {
      whereClause.date = { ...whereClause.date, [Op.lte]: filters.toDate };
    }

    const bookings = await Booking.findAll({
      where: whereClause,
      include: [
        { model: User, attributes: ['id', 'name', 'email'] },
        { model: Room, attributes: ['id', 'name', 'room_number', 'room_type'] }
      ],
      order: [['date', 'DESC'], ['start_time', 'ASC']]
    });

    return bookings;
  }

    // Получение расписания комнаты на дату
  async getRoomSchedule(roomId: number, date: string): Promise<Booking[]> {
    const bookings = await Booking.findAll({
      where: {
        room_id: roomId,
        date: date,
        status: { [Op.in]: ['confirmed', 'pending'] }
      },
      include: [{
        model: User,
        attributes: ['id', 'name']
      }],
      order: [['start_time', 'ASC']]
    });

    return bookings;
  }


  // Поиск свободных комнат на указанное время
  async findAvailableRooms(
    date: string,
    startTime: string,
    endTime: string,
    capacity?: number,
    roomType?: string
  ): Promise<Room[]> {
    // Находим все занятые комнаты на указанное время
    const busyBookings = await Booking.findAll({
      where: {
        date,
        status: { [Op.in]: ['confirmed', 'pending'] },
        [Op.and]: [
          { start_time: { [Op.lt]: endTime } },
          { end_time: { [Op.gt]: startTime } }
        ]
      },
      attributes: ['room_id']
    });

    const busyRoomIds = busyBookings.map(b => b.room_id);

    // Поиск свободных комнат
    const whereClause: WhereOptions = {
      is_active: true,
      id: { [Op.notIn]: busyRoomIds.length ? busyRoomIds : [0] }
    };

    if (capacity) {
      whereClause.capacity = { [Op.gte]: capacity };
    }

    if (roomType) {
      whereClause.room_type = roomType;
    }

    const availableRooms = await Room.findAll({
      where: whereClause,
      order: [['id', 'ASC']]
    });

    return availableRooms;
  }
}

export default new BookingService();