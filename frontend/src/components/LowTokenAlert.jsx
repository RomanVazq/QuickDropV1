// Archivo: LowTokenAlert.jsx
import React from 'react';
import { AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

const LowTokenAlert = ({ tokensLeft, onRecharge }) => { 
    const handleRechargeClick = () => {
        toast.dismiss();
        if (onRecharge) onRecharge();
    };

    return (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 flex items-center">
            <AlertCircle className="w-6 h-6 mr-3"/>
            <div className="flex-1">
                <p className="font-bold">Atención: Quedan solo {tokensLeft} tokens</p>
                <p className="text-sm">Por favor, recarga tus tokens para evitar interrupciones en el servicio.</p>
            </div>  
            <button
                onClick={handleRechargeClick}
                className="ml-4 bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors"
            >
                Recargar
            </button>
        </div>  
    );
}
export default LowTokenAlert;