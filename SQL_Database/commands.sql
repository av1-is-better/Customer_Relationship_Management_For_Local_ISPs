CREATE TABLE IF NOT EXISTS admins
(
    email text NOT NULL,
    phone text,
    name varchar(50),
    admin_timestamp timestamp DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT admins_pkey PRIMARY KEY (email)
);

CREATE TABLE IF NOT EXISTS tariff_plans(
	plan_id BIGSERIAL PRIMARY KEY,
	plan_name TEXT UNIQUE,
	plan_speed INT,
	speed_unit TEXT,
	plan_validity INT,
	validity_unit TEXT,
	plan_cost INT
);

CREATE TABLE IF NOT EXISTS users
(
    email text NOT NULL,
    phone text,
    name text,
    id_type text,
    id_value text,
    address text,
    city text,
    area_code text,
    user_id text,
    picture bytea,
    gender text,
    user_timestamp timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    plan_id integer,
    CONSTRAINT users_pkey PRIMARY KEY (email),
    CONSTRAINT fk_plan_id FOREIGN KEY (plan_id)
        REFERENCES tariff_plans(plan_id)
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)


CREATE TABLE IF NOT EXISTS passwords
(
    email text NOT NULL,
    password text,
    CONSTRAINT password_pkey PRIMARY KEY (email),
    CONSTRAINT password_email_fkey FOREIGN KEY (email)
        REFERENCES users(email)
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
);

CREATE TABLE IF NOT EXISTS transactions
(
    invoice BIGSERIAL NOT NULL,  -- Automatically uses a sequence for invoice
    id text NOT NULL,
    email text NOT NULL,
    mode text NOT NULL,
    amount integer NOT NULL,
    date date NOT NULL DEFAULT CURRENT_DATE,
    transaction_timestamp timestamp DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT transactions_pkey PRIMARY KEY (invoice),
    CONSTRAINT transactions_email_fkey FOREIGN KEY (email)
        REFERENCES users(email)
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
);


CREATE TABLE IF NOT EXISTS issues
(
    issue_date date NOT NULL,
    issue_no BIGSERIAL NOT NULL,
    email text NOT NULL,
    issue_title text NOT NULL,
    issue_content text NOT NULL,
    issue_status boolean NOT NULL,
    issue_timestamp timestamp DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT issues_pkey PRIMARY KEY (issue_no),
    CONSTRAINT issues_email_fkey FOREIGN KEY (email)
        REFERENCES users(email)
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
);


CREATE TABLE IF NOT EXISTS reviews(
review_no BIGSERIAL PRIMARY KEY NOT NULL,
review_date DATE DEFAULT CURRENT_DATE,
email TEXT NOT NULL,
review_rating INT NOT NULL,
review_description TEXT NOT NULL,
CONSTRAINT review_email_fkey FOREIGN KEY (email)
        REFERENCES users(email)
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
);

CREATE TABLE IF NOT EXISTS logs
(
    log_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    log_text TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS announcements(
	id BIGSERIAL PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	title TEXT,
	message TEXT
);


CREATE OR REPLACE FUNCTION log_operations() RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- For users table
        IF TG_TABLE_NAME = 'users' THEN
            INSERT INTO logs(log_timestamp, log_text) 
            VALUES (CURRENT_TIMESTAMP, 'New Client Created ' || NEW.email);
        -- For transactions table
        ELSIF TG_TABLE_NAME = 'transactions' THEN
            INSERT INTO logs(log_timestamp, log_text) 
            VALUES (CURRENT_TIMESTAMP, 'Transaction Created For ' || NEW.email);
        -- For reviews table
        ELSIF TG_TABLE_NAME = 'reviews' THEN
            INSERT INTO logs(log_timestamp, log_text) 
            VALUES (CURRENT_TIMESTAMP, 'New Review Given By ' || NEW.email);
        -- For issues table
        ELSIF TG_TABLE_NAME = 'issues' THEN
            INSERT INTO logs(log_timestamp, log_text) 
            VALUES (CURRENT_TIMESTAMP, 'Complaint Filed By ' || NEW.email);
        -- For announcements table
        ELSIF TG_TABLE_NAME = 'announcements' THEN
            INSERT INTO logs(log_timestamp, log_text) 
            VALUES (CURRENT_TIMESTAMP, 'New Announcement Created');
        -- For tariff_plans table
        ELSIF TG_TABLE_NAME = 'tariff_plans' THEN
            INSERT INTO logs(log_timestamp, log_text) 
            VALUES (CURRENT_TIMESTAMP, 'New Tariff Created ' || NEW.plan_name);
        END IF;
        
    ELSIF TG_OP = 'UPDATE' THEN
        -- For users table
        IF TG_TABLE_NAME = 'users' THEN
            INSERT INTO logs(log_timestamp, log_text) 
            VALUES (CURRENT_TIMESTAMP, 'Client Profile Modified ' || NEW.email);
        -- For transactions table
        ELSIF TG_TABLE_NAME = 'transactions' THEN
            INSERT INTO logs(log_timestamp, log_text) 
            VALUES (CURRENT_TIMESTAMP, 'Transaction Modified, Trnx ID: ' || NEW.id || ' EMAIL: ' || NEW.email);
        -- For reviews table
        ELSIF TG_TABLE_NAME = 'reviews' THEN
            INSERT INTO logs(log_timestamp, log_text) 
            VALUES (CURRENT_TIMESTAMP, 'Review Modified By ' || NEW.email);
        -- For issues table
        ELSIF TG_TABLE_NAME = 'issues' THEN
            INSERT INTO logs(log_timestamp, log_text) 
            VALUES (CURRENT_TIMESTAMP, 'Complaint Status Updated For Client ' || NEW.email);
        -- For announcements table
        ELSIF TG_TABLE_NAME = 'announcements' THEN
            INSERT INTO logs(log_timestamp, log_text) 
            VALUES (CURRENT_TIMESTAMP, 'Announcement Updated');
        -- For tariff_plans table
        ELSIF TG_TABLE_NAME = 'tariff_plans' THEN
            INSERT INTO logs(log_timestamp, log_text) 
            VALUES (CURRENT_TIMESTAMP, 'Tariff Updated ' || OLD.plan_name);
        END IF;

    ELSIF TG_OP = 'DELETE' THEN
        -- For users table
        IF TG_TABLE_NAME = 'users' THEN
            INSERT INTO logs(log_timestamp, log_text) 
            VALUES (CURRENT_TIMESTAMP, 'Client Deleted ' || OLD.email);
        -- For transactions table
        ELSIF TG_TABLE_NAME = 'transactions' THEN
            INSERT INTO logs(log_timestamp, log_text) 
            VALUES (CURRENT_TIMESTAMP, 'Transaction Deleted, Trnx ID: ' || OLD.id || ' EMAIL: ' || OLD.email);
        -- For reviews table
        ELSIF TG_TABLE_NAME = 'reviews' THEN
            INSERT INTO logs(log_timestamp, log_text) 
            VALUES (CURRENT_TIMESTAMP, 'Review Deleted By ' || OLD.email);
        -- For issues table
        ELSIF TG_TABLE_NAME = 'issues' THEN
            INSERT INTO logs(log_timestamp, log_text) 
            VALUES (CURRENT_TIMESTAMP, 'Complaint Deleted For Client ' || OLD.email);
        -- For announcements table
        ELSIF TG_TABLE_NAME = 'announcements' THEN
            INSERT INTO logs(log_timestamp, log_text) 
            VALUES (CURRENT_TIMESTAMP, 'Announcement Deleted');
        -- For tariff_plans table
        ELSIF TG_TABLE_NAME = 'tariff_plans' THEN
            INSERT INTO logs(log_timestamp, log_text) 
            VALUES (CURRENT_TIMESTAMP, 'Tariff Deleted ' || OLD.plan_name);
        END IF;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;


CREATE TRIGGER users_log_trigger
AFTER INSERT OR UPDATE OR DELETE ON users
FOR EACH ROW EXECUTE FUNCTION log_operations();



CREATE TRIGGER transactions_log_trigger
AFTER INSERT OR UPDATE OR DELETE ON transactions
FOR EACH ROW EXECUTE FUNCTION log_operations();


CREATE TRIGGER reviews_log_trigger
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW EXECUTE FUNCTION log_operations();


CREATE TRIGGER issues_log_trigger
AFTER INSERT OR UPDATE OR DELETE ON issues
FOR EACH ROW EXECUTE FUNCTION log_operations();

CREATE TRIGGER announcements_log_trigger
AFTER INSERT OR UPDATE OR DELETE ON announcements
FOR EACH ROW EXECUTE FUNCTION log_operations();

CREATE TRIGGER tariff_log_trigger
AFTER INSERT OR UPDATE OR DELETE ON tariff_plans
FOR EACH ROW EXECUTE FUNCTION log_operations();