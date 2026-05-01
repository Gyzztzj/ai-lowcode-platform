import {
  Controller,
  Get,
  Put,
  Delete,
  Query,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RecycleBinService } from './recycle-bin.service';

interface RequestWithUser {
  user: { id: string };
}

@ApiTags('recycle-bin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('recycle-bin')
export class RecycleBinController {
  constructor(private readonly recycleBinService: RecycleBinService) {}

  @Get()
  @ApiOperation({ summary: '获取回收站内容' })
  getDeleted(@Request() req: RequestWithUser, @Query('type') type?: string) {
    return this.recycleBinService.findDeleted(req.user.id, type);
  }

  @Put(':type/:id/restore')
  @ApiOperation({ summary: '从回收站恢复资源' })
  restore(
    @Request() req: RequestWithUser,
    @Param('type') type: string,
    @Param('id') id: string,
  ) {
    return this.recycleBinService.restore(req.user.id, type, id);
  }

  @Delete(':type/:id')
  @ApiOperation({ summary: '永久删除回收站资源' })
  permanentDelete(
    @Request() req: RequestWithUser,
    @Param('type') type: string,
    @Param('id') id: string,
  ) {
    return this.recycleBinService.permanentDelete(req.user.id, type, id);
  }
}
