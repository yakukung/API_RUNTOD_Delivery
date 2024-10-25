SELECT o.order_id, sd.status, sd.image_status
FROM orders o, status_delivery sd
GROUP BY o.order_id, sd.status



SELECT *
FROM orders
WHERE receiver_id = 2 OR sender_id = 2;



SELECT 
    orders.order_id,
    sender.fullname AS sender_name,
    receiver.fullname AS receiver_name,
    orders.sender_address,
    orders.receiver_address,
    orders.status,
    COUNT(order_items.order_id) AS total_orders,
    status_delivery.image_status
FROM orders
JOIN users AS sender ON orders.sender_id = sender.uid
JOIN users AS receiver ON orders.receiver_id = receiver.uid
LEFT JOIN order_items ON orders.order_id = order_items.order_id
LEFT JOIN status_delivery ON orders.order_id = status_delivery.order_id
WHERE sender.uid = 2 OR receiver.uid = 2
GROUP BY orders.order_id, sender.fullname, receiver.fullname, orders.sender_address, orders.receiver_address, orders.status, status_delivery.image_status;
