CREATE TABLE `companies_metadata` (
  `domain` varchar(255) PRIMARY KEY COMMENT 'Unique web domain of company acting as the primary identifier',
  `name` varchar(255) COMMENT 'Name of the company',
  `category` varchar(255) COMMENT 'Industry vertical (e.g., SaaS, Manufacturing)',
  `city` varchar(255),
  `state` varchar(255),
  `country` varchar(255),
  `zipcode` varchar(255)
);

CREATE TABLE `companies_techdata` (
  `name` varchar(255) COMMENT 'Name of the technology or tool (e.g., ''React'', ''AWS'')',
  `category` varchar(255) COMMENT 'Type of tech (e.g., ''Frontend Framework'', ''Cloud Provider'')',
  `domain` varchar(255) NOT NULL COMMENT 'Foreign key linking back to the companies_metadata table',
  PRIMARY KEY (`name`, `domain`)
);

CREATE INDEX `companies_metadata_index_0` ON `companies_metadata` (`category`);

CREATE INDEX `companies_metadata_index_1` ON `companies_metadata` (`country`);

CREATE INDEX `companies_techdata_index_2` ON `companies_techdata` (`domain`);

ALTER TABLE `companies_metadata` COMMENT = 'Master table for company-level information';

ALTER TABLE `companies_techdata` COMMENT = 'Transactional table tracking tech stacks per company domain, uses name and domain as composite primary key';

ALTER TABLE `companies_techdata` ADD FOREIGN KEY (`domain`) REFERENCES `companies_metadata` (`domain`) ON DELETE CASCADE ON UPDATE CASCADE;
