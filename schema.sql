psql;

CREATE DATABASE reviews;

\c reviews;

CREATE TABLE review (
    id serial primary key,
    product_id varchar,
    rating integer,
    date date,
    summary VARCHAR(100),
    body varchar(1000),
    recommend boolean,
    reported boolean,
    reviewer_name varchar,
    reviewer_email varchar,
    response varchar,
    helpfulness integer
);

CREATE TABLE characteristics (
    characteristics_id serial primary key,
    product_id varchar,
    name varchar
);

CREATE TABLE characteristics_reviews (
    id serial primary key,
    characteristics_id integer references characteristics(characteristics_id),
    review_id integer references review(id),
    value integer
);

CREATE TABLE photos (
    photo_id serial primary key,
    review_id integer references review(id),
    url varchar
);


