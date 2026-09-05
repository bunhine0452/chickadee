SELECT a.sku, b.sku
  FROM item a
  JOIN item b ON a.cart_id = b.cart_id;
