import { User } from '../users/users.entity';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UEEntity } from './unite-enseignement.entity';
// import { Document } from './document.entity';
import { UserProfile } from '../users/user-profile.entity';


@Entity()
export class Matiers {
  constructor(partial?: Partial<Matiers>) {
    Object.assign(this, partial);
  }
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  createdAt: Date;

  @Column({ type: 'mediumtext' })
  nom: string;

  @ManyToOne(() => UserProfile, (userProfile) => userProfile.matiers)
  owner?: User;

  @ManyToOne(() => UEEntity, (ueentity) => ueentity.matiers)
  ueentity: UEEntity;

//   @OneToMany(() => Document, (document) => document.conversation)
//   ticketDocuments: Document[];

  @Column({ nullable: true })
  isSynchronised: boolean;
}
