DROP DATABASE IF EXISTS `drizzle`;
CREATE DATABASE `drizzle`;
CREATE TABLE `drizzle`.`account` (
	`id` varchar(255) NOT NULL,
	`user_id` varchar(255) NOT NULL,
	CONSTRAINT `account_id` PRIMARY KEY(`id`)
);
CREATE TABLE `drizzle`.`user` (
	`id` varchar(255) NOT NULL,
	`name` text,
	CONSTRAINT `user_id` PRIMARY KEY(`id`)
);
ALTER TABLE `account` ADD CONSTRAINT `account_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE no action ON UPDATE no action;
