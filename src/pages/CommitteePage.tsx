import React, { useState, useEffect } from 'react';
import { faker } from '@faker-js/faker';
import { User, Mail, Phone } from 'lucide-react';

interface CommitteeMember {
  id: string;
  name: string;
  title: string;
  avatar: string;
  email: string;
  phone: string;
  district: string;
}

const generateCommitteeMembers = (count: number): CommitteeMember[] => {
  const titles = [
    'President', 'Vice President', 'General Secretary', 'Treasurer', 'Joint Secretary',
    'Executive Member', 'Executive Member', 'Executive Member', 'Executive Member', 'Executive Member'
  ];
  return Array.from({ length: count }, (_, index) => ({
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    title: titles[index % titles.length],
    avatar: faker.image.avatar(),
    email: faker.internet.email().toLowerCase(),
    phone: faker.phone.number(),
    district: faker.location.state(),
  }));
};

const CommitteePage: React.FC = () => {
  const [members, setMembers] = useState<CommitteeMember[]>([]);

  useEffect(() => {
    setMembers(generateCommitteeMembers(10));
  }, []);

  return (
    <div className="bg-gray-50 py-16 sm:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Executive Committee
          </h1>
          <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
            Meet the dedicated leaders and office bearers steering the Kerala Medical Distributors Association.
          </p>
        </div>

        <div className="mt-16 grid gap-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {members.map((member) => (
            <div key={member.id} className="bg-white rounded-lg shadow-lg overflow-hidden text-center transform hover:scale-105 transition-transform duration-300">
              <div className="p-6">
                <img className="w-32 h-32 rounded-full mx-auto object-cover ring-4 ring-emerald-200" src={member.avatar} alt={member.name} />
                <h3 className="mt-6 text-xl font-semibold text-gray-900">{member.name}</h3>
                <p className="text-emerald-700 font-medium">{member.title}</p>
                <p className="text-sm text-gray-500">{member.district}</p>
              </div>
              <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
                <div className="flex flex-col space-y-2 text-sm text-gray-600">
                  <a href={`mailto:${member.email}`} className="flex items-center justify-center hover:text-emerald-700">
                    <Mail className="h-4 w-4 mr-2" />
                    <span>Email</span>
                  </a>
                  <a href={`tel:${member.phone}`} className="flex items-center justify-center hover:text-emerald-700">
                    <Phone className="h-4 w-4 mr-2" />
                    <span>Call</span>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CommitteePage;
