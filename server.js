// server.js - Бэкенд для NEON RED магазина с админ-панелью
const express = require('express');

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

if (!process.env.JWT_SECRET || !process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
  console.error('Missing required env vars. Make sure JWT_SECRET, SUPABASE_URL and SUPABASE_KEY are set.');
  process.exit(1);
}

const app = express();

app.use(helmet());
const apiLimiter = rateLimit({ windowMs: 15*60*1000, max: 200 });
app.use('/api/', apiLimiter);
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({...{
    origin: ['https://shop.mkntw.xyz', 'http://localhost:3000'],
    credentials: true
}, credentials: true}));
app.use(express.json());

// Supabase клиент
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

// JWT секрет
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// === МИДЛВАР ДЛЯ АУТЕНТИФИКАЦИИ ===
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Требуется аутентификация' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Неверный токен' });
        }
        req.user = user;
        next();
    });
};

const authenticateAdmin = (req, res, next) => {
    if (!req.user || !req.user.isAdmin) {
        return res.status(403).json({ error: 'Требуются права администратора' });
    }
    next();
};

// === АУТЕНТИФИКАЦИЯ ===

// Регистрация
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password, fullName } = req.body;

        // Проверка существования пользователя
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .or(`username.eq.${username},email.eq.${email}`)
            .single();

        if (existingUser) {
            return res.status(400).json({ 
                error: 'Пользователь с таким email или username уже существует' 
            });
        }

        // Хэширование пароля
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Создание пользователя
        // Создание пользователя (первый пользователь становится админом)
        const { count } = await supabase
            .from('users')
            .select('*', { count: 'exact' });
            
        const isAdmin = count === 0; // Первый пользователь становится админом
        
        const { data: user, error } = await supabase
            .from('users')
            .insert([{
                username,
                email,
                password_hash: passwordHash,
                full_name: fullName,
                is_admin: false
                is_admin: isAdmin
            }])
            .select()
            .single();

        if (error) throw error;

        // Создание JWT токена
        const token = jwt.sign(
            { 
                id: user.id, 
                username: user.username, 
                isAdmin: user.is_admin 
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'Регистрация успешна',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                fullName: user.full_name,
                isAdmin: user.is_admin
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Ошибка регистрации' });
    }
});

// Вход
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Поиск пользователя
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .single();

        if (error || !user) {
            return res.status(401).json({ error: 'Неверные учетные данные' });
        }

        // Проверка пароля
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Неверные учетные данные' });
        }

        // Создание JWT токена
        const token = jwt.sign(
            { 
                id: user.id, 
                username: user.username, 
                isAdmin: user.is_admin 
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Вход выполнен',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                fullName: user.full_name,
                isAdmin: user.is_admin
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Ошибка входа' });
    }
});

// Проверка токена
app.get('/api/validate-token', authenticateToken, (req, res) => {
    res.json({ valid: true, user: req.user });
});

// === КАТЕГОРИИ ===

// Получить все категории
app.get('/api/categories', async (req, res) => {
    try {
        const { data: categories, error } = await supabase
            .from('categories')
            .select('*')
            .order('name');
            
        if (error) throw error;
        
        res.json(categories);
        
    } catch (error) {
        console.error('Categories error:', error);
        res.status(500).json({ error: 'Ошибка загрузки категорий' });
    }
});

// Создать категорию (админ)
app.post('/api/admin/categories', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const { name } = req.body;
        
        const { data: category, error } = await supabase
            .from('categories')
            .insert([{ name }])
            .select()
            .single();
            
        if (error) throw error;
        
        res.status(201).json(category);
        
    } catch (error) {
        console.error('Create category error:', error);
        res.status(500).json({ error: 'Ошибка создания категории' });
    }
});

// Обновить категорию (админ)
app.put('/api/admin/categories/:id', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const { name } = req.body;
        
        // Обновляем категорию в товарах
        const { error: updateProductsError } = await supabase
            .from('products')
            .update({ category: name })
            .eq('category', req.body.oldName || name);
            
        if (updateProductsError) throw updateProductsError;
        
        // Обновляем саму категорию
        const { data: category, error } = await supabase
            .from('categories')
            .update({ name })
            .eq('id', req.params.id)
            .select()
            .single();
            
        if (error) throw error;
        
        res.json(category);
        
    } catch (error) {
        console.error('Update category error:', error);
        res.status(500).json({ error: 'Ошибка обновления категории' });
    }
});

// Удалить категорию (админ)
app.delete('/api/admin/categories/:id', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        // Удаляем категорию из товаров (обнуляем поле category)
        const { error: updateProductsError } = await supabase
            .from('products')
            .update({ category: null })
            .eq('category', req.query.name);
            
        if (updateProductsError) throw updateProductsError;
        
        // Удаляем саму категорию
        const { error } = await supabase
            .from('categories')
            .delete()
            .eq('id', req.params.id);
            
        if (error) throw error;
        
        res.json({ message: 'Категория удалена' });
        
    } catch (error) {
        console.error('Delete category error:', error);
        res.status(500).json({ error: 'Ошибка удаления категории' });
    }
});

// === ТОВАРЫ ===

// Получить все товары
app.get('/api/products', async (req, res) => {
    try {
        const { category, featured } = req.query;
        let query = supabase.from('products').select('*');

        if (category) {
            query = query.eq('category', category);
        }

        if (featured === 'true') {
            query = query.eq('featured', true);
        }

        const { data: products, error } = await query;

        if (error) throw error;

        // Добавляем полные URL изображений
        const productsWithImages = products.map(product => ({
            ...product,
            image_url: product.image_path 
                ? `${process.env.SUPABASE_URL}/storage/v1/object/public/product-images/${product.image_path}`
                : null
                : product.image_url || 'https://via.placeholder.com/300'
        }));

        res.json(productsWithImages);

    } catch (error) {
        console.error('Products error:', error);
        res.status(500).json({ error: 'Ошибка загрузки товаров' });
    }
});

// Получить товар по ID
app.get('/api/products/:id', async (req, res) => {
    try {
        const { data: product, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (error) throw error;

        if (product.image_path) {
            product.image_url = `${process.env.SUPABASE_URL}/storage/v1/object/public/product-images/${product.image_path}`;
        }

        res.json(product);

    } catch (error) {
        console.error('Product error:', error);
        res.status(404).json({ error: 'Товар не найден' });
    }
});

// Создать товар (только админ)
app.post('/api/products', authenticateToken, authenticateAdmin, async (req, res) => {
// === АДМИНСКИЕ ЭНДПОИНТЫ ДЛЯ ТОВАРОВ ===

// Получить все товары (админ)
app.get('/api/admin/products', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const { data: products, error } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        
        const productsWithImages = products.map(product => ({
            ...product,
            image_url: product.image_path 
                ? `${process.env.SUPABASE_URL}/storage/v1/object/public/product-images/${product.image_path}`
                : product.image_url || 'https://via.placeholder.com/300'
        }));
        
        res.json(productsWithImages);
        
    } catch (error) {
        console.error('Admin products error:', error);
        res.status(500).json({ error: 'Ошибка загрузки товаров' });
    }
});

// Создать товар (админ)
app.post('/api/admin/products', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const productData = req.body;
        const { data: product, error } = await supabase
            .from('products')
            .insert([productData])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json(product);

    } catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({ error: 'Ошибка создания товара' });
    }
});

// Обновить товар (только админ)
app.put('/api/products/:id', authenticateToken, authenticateAdmin, async (req, res) => {
// Обновить товар (админ)
app.put('/api/admin/products/:id', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const { data: product, error } = await supabase
            .from('products')
            .update(req.body)
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;

        res.json(product);

    } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({ error: 'Ошибка обновления товара' });
    }
});

// Загрузить изображение товара (только админ)
app.post('/api/products/:id/upload', authenticateToken, authenticateAdmin, async (req, res) => {
// Удалить товар (админ)
app.delete('/api/admin/products/:id', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        // В реальном приложении используйте multer для загрузки файлов
        // Это упрощенный пример
        res.json({ message: 'Функция загрузки изображений будет реализована' });
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', req.params.id);
            
        if (error) throw error;
        
        res.json({ message: 'Товар удален' });
        
    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({ error: 'Ошибка удаления товара' });
    }
});

// === АДМИНСКИЕ ЭНДПОИНТЫ ДЛЯ ПОЛЬЗОВАТЕЛЕЙ ===

// Получить всех пользователей (админ)
app.get('/api/admin/users', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const { data: users, error } = await supabase
            .from('users')
            .select('id, username, email, full_name, is_admin, created_at')
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        
        res.json(users);
        
    } catch (error) {
        console.error('Admin users error:', error);
        res.status(500).json({ error: 'Ошибка загрузки пользователей' });
    }
});

// Получить заказы пользователя (админ)
app.get('/api/admin/users/:id/orders', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const { data: orders, error } = await supabase
            .from('orders')
            .select(`
                *,
                order_items (
                    *,
                    products (*)
                )
            `)
            .eq('user_id', req.params.id)
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        
        res.json(orders);
        
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Ошибка загрузки' });
        console.error('Admin user orders error:', error);
        res.status(500).json({ error: 'Ошибка загрузки заказов' });
    }
});

// === ЗАКАЗЫ ===
// === АДМИНСКИЕ ЭНДПОИНТЫ ДЛЯ ЗАКАЗОВ ===

// Получить все заказы (админ)
app.get('/api/admin/orders', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const { data: orders, error } = await supabase
            .from('orders')
            .select(`
                *,
                order_items (
                    *,
                    products (*)
                ),
                users (username, email)
            `)
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        
        res.json(orders);
        
    } catch (error) {
        console.error('Admin orders error:', error);
        res.status(500).json({ error: 'Ошибка загрузки заказов' });
    }
});

// Обновить статус заказа (админ)
app.put('/api/admin/orders/:id/status', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const { status } = req.body;
        
        const { data: order, error } = await supabase
            .from('orders')
            .update({ status })
            .eq('id', req.params.id)
            .select()
            .single();
            
        if (error) throw error;
        
        res.json(order);
        
    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({ error: 'Ошибка обновления статуса заказа' });
    }
});

// === ЗАКАЗЫ (ОБЩИЕ) ===

// Создать заказ
app.post('/api/orders', authenticateToken, async (req, res) => {
    try {
        const { items, shippingAddress, paymentMethod } = req.body;

        // Расчет общей суммы
        const totalAmount = items.reduce((sum, item) => 
            sum + (item.price * item.quantity), 0);

        // Создание заказа
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert([{
                user_id: req.user.id,
                total_amount: totalAmount,
                shipping_address: shippingAddress,
                payment_method: paymentMethod,
                status: 'pending'
            }])
            .select()
            .single();

        if (orderError) throw orderError;

        // Создание элементов заказа
        const orderItems = items.map(item => ({
            order_id: order.id,
            product_id: item.id,
            quantity: item.quantity,
            price_at_time: item.price
        }));

        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItems);

        if (itemsError) throw itemsError;

        // Обновление количества товаров
        for (const item of items) {
            await supabase.rpc('decrease_product_quantity', {
                product_id: item.id,
                amount: item.quantity
            });
        }

        res.status(201).json(order);

    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({ error: 'Ошибка создания заказа' });
    }
});

// Получить заказы пользователя
app.get('/api/orders', authenticateToken, async (req, res) => {
    try {
        const { data: orders, error } = await supabase
            .from('orders')
            .select(`
                *,
                order_items (
                    *,
                    products (*)
                )
            `)
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json(orders);

    } catch (error) {
        console.error('Orders error:', error);
        res.status(500).json({ error: 'Ошибка загрузки заказов' });
    }
});

// === ФУНКЦИИ ДЛЯ БАЗЫ ДАННЫХ ===
// Добавьте эту функцию в Supabase через SQL Editor:
/*
CREATE OR REPLACE FUNCTION decrease_product_quantity(
    product_id INTEGER,
    amount INTEGER
) RETURNS VOID AS $$
BEGIN
    UPDATE products 
    SET quantity = quantity - amount
    WHERE id = product_id AND quantity >= amount;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Недостаточно товара в наличии';
    END IF;
END;
$$ LANGUAGE plpgsql;
*/
// === ГОТОВО ===
    
// Запуск сервера
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
    console.log(`API доступен по адресу: http://localhost:${PORT}/api`);
});
