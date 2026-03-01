import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ParseUUIDPipe,
  ParseIntPipe,
  DefaultValuePipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { EventService } from '../services/event.service';
import { CreateEventDto, CreateEventSchema } from '../dto/create-event.dto';
import { UpdateEventDto, UpdateEventSchema } from '../dto/update-event.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { User } from '../../users/entities/user.entity';

@ApiTags('Events')
@Controller('events')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @ApiOperation({ summary: 'Create a new event (Admin only)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post()
  create(
    @Body(new ZodValidationPipe(CreateEventSchema)) dto: CreateEventDto,
    @CurrentUser() user: User,
  ) {
    return this.eventService.create(dto, user.id);
  }

  @ApiOperation({ summary: 'List published events' })
  @ApiQuery({ name: 'city', required: false })
  @ApiQuery({ name: 'genre', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  @Get()
  findAll(
    @Query('city') city?: string,
    @Query('genre') genre?: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset?: number,
  ) {
    return this.eventService.findAll({ city, genre }, limit, offset);
  }

  @ApiOperation({ summary: 'List my events' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('my')
  findMyEvents(@CurrentUser() user: User) {
    return this.eventService.findMyEvents(user.id);
  }

  @ApiOperation({ summary: 'Get event by ID' })
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.eventService.findOne(id);
  }

  @ApiOperation({ summary: 'Update an event (Admin owner only)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(UpdateEventSchema)) dto: UpdateEventDto,
    @CurrentUser() user: User,
  ) {
    return this.eventService.update(id, dto, user.id);
  }

  @ApiOperation({ summary: 'Cancel an event (Admin owner only)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.eventService.remove(id, user.id);
  }
}
