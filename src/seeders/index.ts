import bcrypt from 'bcryptjs';
import { sequelize, User, Room, Review } from '../models'; // Добавили Review в импорт

export async function runSeeders() {
  try {
    console.log('🌱 Запуск сидеров...');

    // Очистка таблиц 
    await sequelize.sync({ force: true });
    console.log('База данных очищена');

    // Хеширование паролей
    const adminPassword = await bcrypt.hash('admin123', 10);
    const userPassword = await bcrypt.hash('user123', 10);

    // Создание пользователей
    const admin = await User.create({
      email: 'admin@example.com',
      password_hash: adminPassword,
      name: 'Админ Админович',
      role: 'admin',
    });
    console.log('Админ создан');

    const user = await User.create({
      email: 'user@example.com',
      password_hash: userPassword,
      name: 'Иван Петров',
      role: 'user',
    });
    console.log('Пользователь создан');

    const rooms = await Room.bulkCreate([
      {
        name: 'Стандарт одноместный',
        room_number: '101',
        room_type: 'standard',
        capacity: 1,
        has_air_conditioner: true,
        description: 'Уютный номер с одной кроватью, кондиционером и телевизором',
      },
      {
        name: 'Стандарт двухместный',
        room_number: '102',
        room_type: 'standard',
        capacity: 2,
        has_air_conditioner: true,
        description: 'Просторный номер с двумя кроватями',
      },
      {
        name: 'Делюкс',
        room_number: '201',
        room_type: 'deluxe',
        capacity: 2,
        has_air_conditioner: true,
        description: 'Улучшенный номер с видом на город',
      },
      {
        name: 'Люкс',
        room_number: '301',
        room_type: 'suite',
        capacity: 3,
        has_air_conditioner: true,
        description: 'Роскошный номер с гостиной зоной',
      },
      {
        name: 'Семейный',
        room_number: '302',
        room_type: 'family',
        capacity: 4,
        has_air_conditioner: true,
        description: 'Большой номер для всей семьи',
      },
    ]);
    console.log(`✅ Создано ${rooms.length} номеров`);

    const reviews = await Review.bulkCreate([
      {
        user_id: user.id,
        room_id: rooms[0].id,
        rating: 5,
        comment: 'Отличный номер! Чисто, уютно, все понравилось'
      },
      {
        user_id: user.id,
        room_id: rooms[1].id,
        rating: 4,
        comment: 'Хороший номер, но немного шумно'
      },
      {
        user_id: admin.id,
        room_id: rooms[2].id,
        rating: 5,
        comment: 'Прекрасный люкс, рекомендую'
      }
    ]);
    console.log(`Создано ${reviews.length} отзывов`);

    console.log('Сидеры успешно выполнены!');
    
    // Вывод тестовых учетных данных
    console.log('\n=== Тестовые учетные данные ===');
    console.log('Админ: admin@example.com / admin123');
    console.log('Пользователь: user@example.com / user123');
    console.log('===============================\n');

  } catch (error) {
    console.error('Ошибка при выполнении сидеров:', error);
    throw error;
  }
}

// Запуск сидеров, если файл вызван напрямую
if (require.main === module) {
  runSeeders().then(() => process.exit(0));
}