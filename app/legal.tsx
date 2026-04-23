import { ScrollView, Text, View, StyleSheet, Linking } from "react-native";

export default function LegalScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>
        Mentions légales & Politique de confidentialité
      </Text>

      <Text style={styles.paragraph}>
        L’association Association Sportive du golf de Baugé, soucieuse des droits
        des individus et dans une volonté de transparence, met en place une
        politique détaillant les traitements de données et les droits des
        utilisateurs.
      </Text>

      <Text
        style={styles.link}
        onPress={() => Linking.openURL("https://www.cnil.fr/")}
      >
        Consulter le site de la CNIL
      </Text>

      {sections.map((section, index) => (
        <View key={index} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <Text style={styles.paragraph}>{section.content}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const sections = [
  {
    title: "Article 1 – Mentions légales",
    content: `Association sportive du golf de Baugé
SIRET : 44370662300019
Adresse : Domaine des Bordes, Pontigné, 49150 Baugé en Anjou
Téléphone : 02 41 89 01 27
Email : nous.joindre@as-golf-bauge.fr
Présidente : Cécile Ainault

Hébergeur : OVH – 2 rue Kellermann, 59100 Roubaix, France`,
  },
  {
    title: "Article 2 – Accès au site",
    content:
      "L’accès au site est réservé à un usage personnel. Toute utilisation commerciale ou abusive est interdite.",
  },
  {
    title: "Article 3 – Propriété intellectuelle",
    content:
      "Tous les contenus (textes, images, vidéos, etc.) sont protégés. Toute reproduction sans autorisation est interdite.",
  },
  {
    title: "Article 4 – Gestion du site",
    content:
      "L’éditeur peut suspendre ou modifier le site à tout moment pour maintenance ou mise à jour.",
  },
  {
    title: "Article 5 – Responsabilités",
    content:
      "L’éditeur ne peut être tenu responsable en cas de dysfonctionnement ou dommages liés à l’utilisation du site.",
  },
  {
    title: "Article 6 – Liens hypertextes",
    content:
      "Les liens vers le site sont interdits sans autorisation. Le contenu des liens externes n’engage pas l’éditeur.",
  },
  {
    title: "Article 7 – Données personnelles",
    content: `Données collectées :
- Nom, prénom
- Adresse, email, téléphone
- Date de naissance
- Données golfiques

Ces données servent à la gestion des utilisateurs et services.`,
  },
  {
    title: "Article 8 – Vos droits",
    content:
      "Vous disposez d’un droit d’accès, de rectification, de suppression et de portabilité de vos données. Contact : nous.joindre@as-golf-bauge.fr",
  },
  {
    title: "Article 9 – Utilisation des données",
    content:
      "Les données sont utilisées pour le fonctionnement, la sécurité et l’amélioration des services.",
  },
  {
    title: "Article 10 – Conservation",
    content:
      "Les données sont conservées le temps nécessaire aux services et obligations légales.",
  },
  {
    title: "Article 11 – Partage",
    content:
      "Les données peuvent être partagées avec des prestataires uniquement dans l’UE si nécessaire.",
  },
  {
    title: "Article 12 – Offres commerciales",
    content:
      "Vous pouvez refuser les communications commerciales en contactant l’association.",
  },
  {
    title: "Article 13 – Cookies",
    content:
      "Le site utilise des cookies pour améliorer l’expérience utilisateur. Vous pouvez les désactiver dans votre navigateur.",
  },
  {
    title: "Article 14 – Photos",
    content:
      "Les photos ne sont pas contractuelles.",
  },
  {
    title: "Article 15 – Loi applicable",
    content:
      "Le droit français s’applique. Compétence des tribunaux du siège social.",
  },
  {
    title: "Article 16 – Contact",
    content:
      "Contact : nous.joindre@as-golf-bauge.fr",
  },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 6,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 20,
    color: "#333",
  },
  link: {
    color: "#007AFF",
    marginBottom: 20,
  },
});