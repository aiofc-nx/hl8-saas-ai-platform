import { DateTimeValueObject } from '@hl8/domain-base';
import { describe, expect, it } from '@jest/globals';
import { UserProfile } from './user-profile.vo.js';

describe('UserProfile', () => {
  describe('create', () => {
    it('应创建有效的用户资料值对象', () => {
      const profile = UserProfile.create({
        name: '张三',
        gender: 'MALE',
      });

      expect(profile.name).toBe('张三');
      expect(profile.gender).toBe('MALE');
      expect(profile.phoneNumber).toBeNull();
      expect(profile.profilePicture).toBeNull();
      expect(profile.dateOfBirth).toBeNull();
      expect(profile.address).toBeNull();
    });

    it('应自动去除字符串属性的首尾空格', () => {
      const profile = UserProfile.create({
        name: '  张三  ',
        gender: '  MALE  ',
        phoneNumber: '  13800138000  ',
        address: '  北京市  ',
      });

      expect(profile.name).toBe('张三');
      expect(profile.gender).toBe('MALE');
      expect(profile.phoneNumber).toBe('13800138000');
      expect(profile.address).toBe('北京市');
    });

    it('应支持 Date 对象作为出生日期', () => {
      const dateOfBirth = new Date('1990-01-01');
      const profile = UserProfile.create({
        name: '张三',
        gender: 'MALE',
        dateOfBirth,
      });

      expect(profile.dateOfBirth).toBeInstanceOf(DateTimeValueObject);
      expect(profile.dateOfBirth?.toJSDate().getTime()).toBe(
        dateOfBirth.getTime(),
      );
    });

    it('应支持 DateTimeValueObject 作为出生日期', () => {
      const dateOfBirth = DateTimeValueObject.fromISOString('1990-01-01');
      const profile = UserProfile.create({
        name: '张三',
        gender: 'MALE',
        dateOfBirth,
      });

      expect(profile.dateOfBirth).toBe(dateOfBirth);
    });

    it('应处理所有可选属性', () => {
      const profile = UserProfile.create({
        name: '张三',
        gender: 'MALE',
        phoneNumber: '13800138000',
        profilePicture: 'https://example.com/avatar.jpg',
        dateOfBirth: new Date('1990-01-01'),
        address: '北京市',
      });

      expect(profile.phoneNumber).toBe('13800138000');
      expect(profile.profilePicture).toBe('https://example.com/avatar.jpg');
      expect(profile.dateOfBirth).toBeInstanceOf(DateTimeValueObject);
      expect(profile.address).toBe('北京市');
    });
  });

  describe('update', () => {
    it('应更新用户资料并返回新实例', () => {
      const profile = UserProfile.create({
        name: '张三',
        gender: 'MALE',
      });

      const updated = profile.update({ name: '李四' });

      expect(updated).not.toBe(profile);
      expect(updated.name).toBe('李四');
      expect(updated.gender).toBe('MALE');
      expect(profile.name).toBe('张三');
    });

    it('应支持部分更新', () => {
      const profile = UserProfile.create({
        name: '张三',
        gender: 'MALE',
        phoneNumber: '13800138000',
      });

      const updated = profile.update({ phoneNumber: '13900139000' });

      expect(updated.name).toBe('张三');
      expect(updated.gender).toBe('MALE');
      expect(updated.phoneNumber).toBe('13900139000');
    });

    it('应支持将属性设置为 null', () => {
      const profile = UserProfile.create({
        name: '张三',
        gender: 'MALE',
        phoneNumber: '13800138000',
      });

      const updated = profile.update({ phoneNumber: null });

      expect(updated.phoneNumber).toBeNull();
    });

    it('应支持更新出生日期', () => {
      const profile = UserProfile.create({
        name: '张三',
        gender: 'MALE',
        dateOfBirth: new Date('1990-01-01'),
      });

      const newDate = new Date('1991-01-01');
      const updated = profile.update({ dateOfBirth: newDate });

      expect(updated.dateOfBirth?.toJSDate().getTime()).toBe(newDate.getTime());
    });
  });
});
