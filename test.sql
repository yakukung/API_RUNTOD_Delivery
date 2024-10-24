SELECT o.order_id, sd.status, sd.image_status
FROM orders o, status_delivery sd
GROUP BY o.order_id, sd.status

WHERE o.order_id = 1