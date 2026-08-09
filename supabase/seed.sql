-- Thoothukudi demo seed (run after 001_init.sql). Does not create auth users.

INSERT INTO public.stations (id, name, latitude, longitude, total_bays, active_bays, power_kw, source) VALUES
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'VOC Port DC Fast Hub', 8.7946, 78.1603, 6, 4, 60, 'seed'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Palayamkottai Road Supercharger', 8.7245, 78.1302, 4, 3, 50, 'seed'),
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'Harbour Expressway Charging Plaza', 8.7642, 78.1348, 8, 5, 120, 'seed'),
  ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'SPIC Junction EV Depot', 8.7511, 78.1524, 4, 4, 30, 'seed'),
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'Tiruchendur Highway Pitstop', 8.496, 78.119, 3, 2, 50, 'seed')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.merchants (id, station_id, name, category, discount_pct, is_active) VALUES
  ('f1111111-1111-4111-8111-111111111111', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Portside Filter Coffee', 'Cafe', 15, true),
  ('f2222222-2222-4222-8222-222222222222', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'Dwell Time Dosa', 'Restaurant', 20, true),
  ('f3333333-3333-4333-8333-333333333333', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'Charge & Carry Mart', 'Convenience', 10, true),
  ('f4444444-4444-4444-8444-444444444444', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Palm Grove Juice Bar', 'Cafe', 12, true),
  ('f5555555-5555-4555-8555-555555555555', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'SPIC Quick Service', 'Auto care', 8, true),
  ('f6666666-6666-4666-8666-666666666666', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'Temple Road Bakery', 'Bakery', 18, true)
ON CONFLICT (id) DO NOTHING;
