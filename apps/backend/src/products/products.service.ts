import { Injectable } from '@nestjs/common';
import type { CreateProductInput, Product } from '@wslab/shared';

const SEED: Omit<Product, 'id' | 'createdAt'>[] = [
  {
    name: 'Taladro magnético de base 1200 W',
    category: 'Herramienta eléctrica',
    price: 18450,
    description: 'Perforadora de base magnética para acero estructural, admite brocas anulares de hasta 50 mm.',
  },
  {
    name: 'Llave de torque hidráulica 3/4 pulg',
    category: 'Herramienta hidráulica',
    price: 32780.5,
    description: 'Llave de cuadro motriz para apriete controlado de pernos en bridas, rango de 270 a 2700 N·m.',
  },
  {
    name: 'Tornillo hexagonal grado 8 de 3/4 x 4 pulg (caja con 25)',
    category: 'Tornillería',
    price: 1265.4,
    description: 'Tornillo de acero aleado con recubrimiento de zinc amarillo para uniones estructurales de alta carga.',
  },
  {
    name: 'Polipasto eléctrico de cadena 2 t',
    category: 'Izaje',
    price: 46900,
    description: 'Polipasto trifásico de 220/440 V con control colgante, freno electromagnético y 6 m de elevación.',
  },
  {
    name: 'Eslinga plana de poliéster 4 t x 3 m',
    category: 'Izaje',
    price: 1385,
    description: 'Eslinga de doble capa con ojos reforzados y factor de seguridad 7:1 para maniobras de carga.',
  },
  {
    name: 'Disco de corte para acero inoxidable 14 pulg (paquete de 10)',
    category: 'Abrasivos',
    price: 2140.75,
    description: 'Disco de óxido de aluminio libre de hierro para tronzadoras estacionarias de 4100 rpm.',
  },
  {
    name: 'Rodamiento de rodillos cónicos 32210',
    category: 'Transmisión de potencia',
    price: 1789.9,
    description: 'Rodamiento de 50 x 90 x 24.75 mm para cargas radiales y axiales combinadas en reductores.',
  },
  {
    name: 'Cadena de rodillos ANSI 80 (tramo de 3 m)',
    category: 'Transmisión de potencia',
    price: 2960,
    description: 'Cadena simple de paso 1 pulg para transportadores y equipos de transmisión pesada.',
  },
  {
    name: 'Válvula de bola bridada de 2 pulg clase 150',
    category: 'Válvulas',
    price: 7425.3,
    description: 'Cuerpo de acero inoxidable 316, paso completo y asientos de PTFE para líneas de proceso.',
  },
  {
    name: 'Manómetro con glicerina de 0 a 300 psi',
    category: 'Instrumentación',
    price: 865,
    description: 'Carátula de 4 pulg, conexión inferior de 1/2 pulg NPT y caja de acero inoxidable.',
  },
  {
    name: 'Soldadora inversora MIG/MAG de 250 A',
    category: 'Soldadura',
    price: 24890,
    description: 'Equipo multiproceso con alimentador integrado para alambre de 0.8 a 1.2 mm.',
  },
  {
    name: 'Electrodo E7018 de 1/8 pulg (caja de 20 kg)',
    category: 'Soldadura',
    price: 1950.6,
    description: 'Electrodo de bajo hidrógeno para soldadura estructural en todas las posiciones.',
  },
  {
    name: 'Arnés de cuerpo completo con línea de vida',
    category: 'Seguridad industrial',
    price: 3210,
    description: 'Arnés con anillo dorsal y línea de vida con absorbedor de energía de 1.8 m para trabajo en alturas.',
  },
  {
    name: 'Detector portátil de 4 gases',
    category: 'Seguridad industrial',
    price: 15780,
    description: 'Monitorea O2, H2S, CO y LEL con alarmas sonora, visual y por vibración para espacios confinados.',
  },
  {
    name: 'Grasa de litio EP2 (cubeta de 19 kg)',
    category: 'Lubricación',
    price: 2395,
    description: 'Grasa de extrema presión para rodamientos y chumaceras sometidos a cargas pesadas.',
  },
];

@Injectable()
export class ProductsService {
  private readonly products: Product[];
  private nextId: number;

  constructor() {
    const createdAt = new Date('2026-01-15T12:00:00.000Z').toISOString();
    this.products = SEED.map((p, index) => ({ ...p, id: index + 1, createdAt }));
    this.nextId = this.products.length + 1;
  }

  findAll(): Product[] {
    return this.products.map((p) => ({ ...p }));
  }

  findById(id: number): Product | undefined {
    const product = this.products.find((p) => p.id === id);
    return product ? { ...product } : undefined;
  }

  create(input: CreateProductInput): Product {
    const product: Product = {
      id: this.nextId++,
      name: input.name,
      category: input.category,
      price: input.price,
      description: input.description ?? '',
      createdAt: new Date().toISOString(),
    };
    this.products.push(product);
    return { ...product };
  }
}