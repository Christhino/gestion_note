import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Matiers } from './matiers.entity';

@Entity()
export class Transcription {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @ManyToOne(() => Matiers, (matiers) => matiers.noteTranscription)
  notetranscription: Matiers;
}
