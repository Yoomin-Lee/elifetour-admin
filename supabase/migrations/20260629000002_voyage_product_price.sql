-- voyages 테이블에 상품가 컬럼 추가 (KRW 단위, nullable)
ALTER TABLE voyages ADD COLUMN IF NOT EXISTS product_price BIGINT;
