import React, { createContext, useContext } from 'react';
import { Form } from 'antd';
import lemonAudio from '../assets/lemon.mp3';
import majorImg from '../../public/major-img.png';
import backgroundImg from '../../public/background.jpg';
import * as StackBlur from 'stackblur-canvas';
export type FieldType = {
    audioUrl: string;
    audioName: string;
    author: string;
    songName: string;
    majorImg: string;
    backgroundImg: string;
};


const initialValues: FieldType = {
    audioUrl: lemonAudio,
    audioName: 'lemon.mp3',
    author: 'Yonezu Kenshi',
    songName: 'LEMON',
    majorImg: majorImg,
    backgroundImg: backgroundImg,
}

type FormContextType = {
    form: ReturnType<typeof Form.useForm<FieldType>>[0];
    resetForm: () => void;
    initialValues: FieldType;
};

const FormContext = createContext<FormContextType | undefined>(undefined);

export const FormProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [form] = Form.useForm<FieldType>();
    
    const resetForm = () => {
        form.setFieldsValue(initialValues);
    };

    return (
        <FormContext.Provider value={{ form, resetForm, initialValues }}>
            {children}
        </FormContext.Provider>
    );
};

export const useFormContext = () => {
    const context = useContext(FormContext);
    if (context === undefined) {
        throw new Error('useFormContext must be used within a FormProvider');
    }
    return context;
};