import { IsIn } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export const NOTEBOOK_TABS = ['saved', 'difficult'] as const;
export type NotebookTab = (typeof NOTEBOOK_TABS)[number];

export class NotebookQueryDto extends PaginationDto {
  /** saved = từ tự lưu; difficult = từ hay quên trong SRS. */
  @IsIn(NOTEBOOK_TABS)
  tab!: NotebookTab;
}
