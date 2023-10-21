import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './users.entity';
import { UserProfile } from './user-profile.entity';

@Entity()
export class Niveau {
  constructor(partial?: Partial<Niveau>) {
    Object.assign(this, partial);
  }
  @PrimaryGeneratedColumn()
  id: number;
  @Column({
    type: 'varchar',
    length: 100,
  })
  name: string;
  @OneToMany(() => UserProfile, (profile) => profile.niveau)
  users: UserProfile[];
}
