import { ReactNode, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  title: string;
  subtitle: string;
  defaultExpanded?: boolean;
  children: ReactNode;
};

export default function AccordionSection({
  title,
  subtitle,
  defaultExpanded = false,
  children,
}: Props) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <View style={styles.wrapper}>
      <Pressable
        style={styles.header}
        onPress={() => setExpanded((current) => !current)}
      >
        <Text style={styles.title}>{expanded ? "▼" : "▶"} {title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </Pressable>

      {expanded ? <View style={styles.content}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 18,
  },
  header: {
    backgroundColor: "rgba(15,23,42,0.72)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#334155",
    padding: 16,
  },
  title: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "900",
  },
  subtitle: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
    marginTop: 5,
  },
  content: {
    marginTop: 12,
  },
});
