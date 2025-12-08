import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Code, Terminal, Play, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const CodeTools = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");

  const handleExecute = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setOutput(">>> Exécution terminée\nRésultat: OK\n\nTemps d'exécution: 0.234s");
    setLoading(false);
    toast({
      title: "Code exécuté",
      description: "Le script a été exécuté avec succès."
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Éditeur de code */}
      <Card className="bg-[#2a2a2a] border-[#3a3a3a]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Code className="w-5 h-5 text-primary" />
            Éditeur Python
          </CardTitle>
          <CardDescription>Écrivez et exécutez du code Python</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-gray-300">Langage</Label>
            <Select defaultValue="python">
              <SelectTrigger className="bg-[#1a1a1a] border-[#3a3a3a] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="python">Python 3.11</SelectItem>
                <SelectItem value="python39">Python 3.9</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-gray-300">Code</Label>
            <Textarea 
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="# Votre code Python ici
print('Hello, World!')"
              className="bg-[#1a1a1a] border-[#3a3a3a] text-white font-mono min-h-[300px]"
            />
          </div>
          <Button 
            className="w-full" 
            onClick={handleExecute}
            disabled={loading}
          >
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
            Exécuter
          </Button>
        </CardContent>
      </Card>

      {/* Console de sortie */}
      <Card className="bg-[#2a2a2a] border-[#3a3a3a]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Terminal className="w-5 h-5 text-primary" />
            Console
          </CardTitle>
          <CardDescription>Sortie de l'exécution</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-[#0a0a0a] rounded-lg p-4 min-h-[400px] font-mono text-sm text-green-400 whitespace-pre-wrap">
            {output || "En attente d'exécution..."}
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex-1 border-[#3a3a3a] text-gray-300 hover:text-white hover:bg-[#3a3a3a]"
              onClick={() => setOutput("")}
            >
              Effacer
            </Button>
            <Button 
              variant="outline" 
              className="flex-1 border-[#3a3a3a] text-gray-300 hover:text-white hover:bg-[#3a3a3a]"
              onClick={() => {
                navigator.clipboard.writeText(output);
                toast({ title: "Copié", description: "Sortie copiée dans le presse-papier" });
              }}
            >
              Copier
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CodeTools;
