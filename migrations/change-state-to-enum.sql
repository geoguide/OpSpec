ALTER TABLE `players` CHANGE `state` `state` VARCHAR(100)  NOT NULL  DEFAULT '0';
UPDATE `players` SET state = 'START' WHERE state = '0';
UPDATE `players` SET state = 'REG' WHERE state = '1';
UPDATE `players` SET state = 'STORY' WHERE state = '2';
UPDATE `players` SET state = 'FACIAL' WHERE state = '3';
UPDATE `players` SET state = 'OBSERVE' WHERE state = '4';
UPDATE `players` SET state = 'SNACK' WHERE state = '5';
UPDATE `players` SET state = 'EAT' WHERE state = '6';
ALTER TABLE `messages` CHANGE `state` `state` VARCHAR(100)  NOT NULL  DEFAULT '0';
UPDATE `messages` SET state = 'START' WHERE state = '0';
UPDATE `messages` SET state = 'REG' WHERE state = '1';
UPDATE `messages` SET state = 'STORY' WHERE state = '2';
UPDATE `messages` SET state = 'FACIAL' WHERE state = '3';
UPDATE `messages` SET state = 'OBSERVE' WHERE state = '4';
UPDATE `messages` SET state = 'SNACK' WHERE state = '5';
UPDATE `messages` SET state = 'EAT' WHERE state = '6';