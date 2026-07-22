-- PHASE 5: CLEAN LEADING SPECIAL CHARACTERS FROM CUSTOMER NAMES

UPDATE public.customers
SET name = regexp_replace(name, '^[ ,.:\-`''"’‘\s]+', '')
WHERE name ~ '^[ ,.:\-`''"’‘\s]';
