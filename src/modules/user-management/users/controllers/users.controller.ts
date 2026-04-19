import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { UsersService } from '../services/users.service';
import { CreateUserDto } from '../dto/in/create-user.dto';
import { UpdateUserDto } from '../dto/in/update-user.dto';

@Controller('users')
export class UsersController {
	constructor(private readonly usersService: UsersService) { }
}
