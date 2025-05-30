import React from 'react';
import { motion } from 'framer-motion';
import { Users, Shield, Award, MessageSquare } from 'lucide-react';

const About: React.FC = () => {
  const values = [
    {
      icon: <Users className="w-12 h-12 mb-4" />,
      title: 'Yhteisö',
      description: 'Rakennamme luotettavaa yhteisöä, jossa palveluntarjoajat ja asiakkaat kohtaavat turvallisesti.'
    },
    {
      icon: <Shield className="w-12 h-12 mb-4" />,
      title: 'Luotettavuus',
      description: 'Varmistamme kaikkien palveluntarjoajien taustat ja luotettavuuden ennen hyväksymistä.'
    },
    {
      icon: <Award className="w-12 h-12 mb-4" />,
      title: 'Laatu',
      description: 'Pyrimme jatkuvasti parantamaan palvelumme laatua käyttäjäpalautteen perusteella.'
    },
    {
      icon: <MessageSquare className="w-12 h-12 mb-4" />,
      title: 'Avoimuus',
      description: 'Uskomme läpinäkyvään viestintään ja rehellisiin arvosteluihin.'
    }
  ];

  const team = [
    {
      name: 'Matti Virtanen',
      role: 'Toimitusjohtaja',
      image: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      bio: 'Yli 15 vuoden kokemus teknologia-alalta ja startup-yrityksistä.'
    },
    {
      name: 'Liisa Korhonen',
      role: 'Teknologiajohtaja',
      image: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      bio: 'Aikaisemmin työskennellyt johtavissa teknologiayrityksissä sovelluskehityksen parissa.'
    },
    {
      name: 'Juha Mäkinen',
      role: 'Markkinointijohtaja',
      image: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      bio: 'Laaja kokemus digitaalisesta markkinoinnista ja brändin rakentamisesta.'
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-black text-white">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h1 className="heading-lg mb-6">TIETOA MEISTÄ</h1>
            <p className="text-xl">
              PalveluYhteys yhdistää ammattitaitoiset palveluntarjoajat ja palveluja etsivät asiakkaat helposti ja luotettavasti.
              Tavoitteenamme on luoda toimiva alusta, joka helpottaa ihmisten arkea ja auttaa palveluntarjoajia menestymään.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-20 bg-white">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <h2 className="heading-lg mb-6">TARINAMME</h2>
              <p className="text-lg text-gray-600 mb-4">
                PalveluYhteys sai alkunsa vuonna 2023, kun perustajamme Matti Virtanen huomasi, kuinka vaikeaa on löytää luotettavia palveluntarjoajia kodin pieniin ja suuriin projekteihin.
              </p>
              <p className="text-lg text-gray-600 mb-4">
                Samaan aikaan monet ammattilaiset kamppailivat saadakseen asiakkaita ja näkyvyyttä palveluilleen. Tästä syntyi idea alustasta, joka yhdistäisi nämä kaksi ryhmää saumattomasti.
              </p>
              <p className="text-lg text-gray-600">
                Tänään PalveluYhteys on kasvanut Suomen johtavaksi palvelujen välitysalustaksi, joka auttaa tuhansia suomalaisia löytämään ja tarjoamaan laadukkaita palveluja.
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <img
                src="https://images.pexels.com/photos/3184338/pexels-photo-3184338.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
                alt="Tiimimme työskentelemässä"
                className="w-full h-auto shadow-lg"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-20 bg-gray-50">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="heading-lg mb-4">ARVOMME</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Nämä arvot ohjaavat kaikkea toimintaamme ja päätöksentekoamme
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {values.map((value, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="text-center p-6 border border-gray-100 hover:border-gray-300 transition-all duration-300"
              >
                {value.icon}
                <h3 className="text-xl font-anton mb-3">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Our Team */}
      <section className="py-20 bg-white">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="heading-lg mb-4">TIIMIMME</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Tutustuthan tiimiimme, joka tekee PalveluYhteydestä mahdollisen
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {team.map((member, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="text-center"
              >
                <div className="mb-4 overflow-hidden rounded-full mx-auto w-48 h-48">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-xl font-anton mb-1">{member.name}</h3>
                <p className="text-gray-500 mb-3">{member.role}</p>
                <p className="text-gray-600">{member.bio}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 bg-black text-white">
        <div className="container-custom">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center"
          >
            <motion.div variants={itemVariants} className="p-6">
              <div className="text-5xl font-anton mb-3">5000+</div>
              <p className="text-xl">Rekisteröitynyttä käyttäjää</p>
            </motion.div>
            
            <motion.div variants={itemVariants} className="p-6">
              <div className="text-5xl font-anton mb-3">1200+</div>
              <p className="text-xl">Palveluntarjoajaa</p>
            </motion.div>
            
            <motion.div variants={itemVariants} className="p-6">
              <div className="text-5xl font-anton mb-3">15000+</div>
              <p className="text-xl">Onnistunutta varausta</p>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default About;