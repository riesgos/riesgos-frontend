export const customStyleSara = `<?xml version="1.0" encoding="UTF-8"?> <StyledLayerDescriptor xmlns="http://www.opengis.net/sld" xsi:schemaLocation="http://www.opengis.net/sld http://schemas.opengis.net/sld/1.1.0/StyledLayerDescriptor.xsd" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:ogc="http://www.opengis.net/ogc" version="1.1.0" xmlns:se="http://www.opengis.net/se" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"> <NamedLayer> <se:Name>{{{{layername}}}}</se:Name> <UserStyle> <se:Name>custom_style_sara</se:Name> <se:FeatureTypeStyle> <se:Rule> <se:Name>Sin datos</se:Name> <se:Description> <se:Title>Sin datos</se:Title> <se:Abstract>No data</se:Abstract> </se:Description> <ogc:Filter xmlns:ogc="http://www.opengis.net/ogc"> <ogc:PropertyIsEqualTo> <ogc:PropertyName>buildings</ogc:PropertyName> <ogc:Literal>0</ogc:Literal> </ogc:PropertyIsEqualTo> </ogc:Filter> <se:PolygonSymbolizer> <se:Fill> <se:SvgParameter name="fill">#a0a0a0</se:SvgParameter> </se:Fill> <se:Stroke> <se:SvgParameter name="stroke">#6f6f6f</se:SvgParameter> <se:SvgParameter name="stroke-width">1</se:SvgParameter> <se:SvgParameter name="stroke-linejoin">bevel</se:SvgParameter> </se:Stroke> </se:PolygonSymbolizer> </se:Rule> <se:Rule> <se:Name>Daño leve</se:Name> <se:Description> <se:Title>Daño leve</se:Title> <se:Abstract>Light damage</se:Abstract> </se:Description> <ogc:Filter xmlns:ogc="http://www.opengis.net/ogc"> <ogc:And> <ogc:PropertyIsGreaterThan> <ogc:PropertyName>buildings</ogc:PropertyName> <ogc:Literal>0</ogc:Literal> </ogc:PropertyIsGreaterThan> <ogc:PropertyIsLessThan> <ogc:PropertyName>w_damage</ogc:PropertyName> <ogc:Literal>1.0</ogc:Literal> </ogc:PropertyIsLessThan> </ogc:And> </ogc:Filter> <se:PolygonSymbolizer> <se:Fill> <se:SvgParameter name="fill">#8cbaa7</se:SvgParameter> </se:Fill> <se:Stroke> <se:SvgParameter name="stroke">#729787</se:SvgParameter> <se:SvgParameter name="stroke-width">1</se:SvgParameter> <se:SvgParameter name="stroke-linejoin">bevel</se:SvgParameter> </se:Stroke> </se:PolygonSymbolizer> </se:Rule> <se:Rule> <se:Name>Daño moderado</se:Name> <se:Description> <se:Title>Daño moderado</se:Title> <se:Abstract>Moderate damage</se:Abstract> </se:Description> <ogc:Filter xmlns:ogc="http://www.opengis.net/ogc"> <ogc:And> <ogc:PropertyIsLessThanOrEqualTo> <ogc:Literal>1.0</ogc:Literal> <ogc:PropertyName>w_damage</ogc:PropertyName> </ogc:PropertyIsLessThanOrEqualTo> <ogc:PropertyIsLessThan> <ogc:PropertyName>w_damage</ogc:PropertyName> <ogc:Literal>2</ogc:Literal> </ogc:PropertyIsLessThan> </ogc:And> </ogc:Filter> <se:PolygonSymbolizer> <se:Fill> <se:SvgParameter name="fill">#e8e9ab</se:SvgParameter> </se:Fill> <se:Stroke> <se:SvgParameter name="stroke">#c4c490</se:SvgParameter> <se:SvgParameter name="stroke-width">1</se:SvgParameter> <se:SvgParameter name="stroke-linejoin">bevel</se:SvgParameter> </se:Stroke> </se:PolygonSymbolizer> </se:Rule> <se:Rule> <se:Name>Daño fuerte</se:Name> <se:Description> <se:Title>Daño fuerte</se:Title> <se:Abstract>Heavy damage</se:Abstract> </se:Description> <ogc:Filter xmlns:ogc="http://www.opengis.net/ogc"> <ogc:And> <ogc:PropertyIsLessThanOrEqualTo> <ogc:Literal>2</ogc:Literal> <ogc:PropertyName>w_damage</ogc:PropertyName> </ogc:PropertyIsLessThanOrEqualTo> <ogc:PropertyIsLessThan> <ogc:PropertyName>w_damage</ogc:PropertyName> <ogc:Literal>3</ogc:Literal> </ogc:PropertyIsLessThan> </ogc:And> </ogc:Filter> <se:PolygonSymbolizer> <se:Fill> <se:SvgParameter name="fill">#fed7aa</se:SvgParameter> </se:Fill> <se:Stroke> <se:SvgParameter name="stroke">#bfa280</se:SvgParameter> <se:SvgParameter name="stroke-width">1</se:SvgParameter> <se:SvgParameter name="stroke-linejoin">bevel</se:SvgParameter> </se:Stroke> </se:PolygonSymbolizer> </se:Rule> <se:Rule> <se:Name>Daño severo</se:Name> <se:Description> <se:Title>Daño severo</se:Title> <se:Abstract>Severe damage</se:Abstract> </se:Description> <ogc:Filter xmlns:ogc="http://www.opengis.net/ogc"> <ogc:PropertyIsLessThanOrEqualTo> <ogc:Literal>3</ogc:Literal> <ogc:PropertyName>w_damage</ogc:PropertyName> </ogc:PropertyIsLessThanOrEqualTo> </ogc:Filter> <se:PolygonSymbolizer> <se:Fill> <se:SvgParameter name="fill">#d78b8b</se:SvgParameter> </se:Fill> <se:Stroke> <se:SvgParameter name="stroke">#a86d6d</se:SvgParameter> <se:SvgParameter name="stroke-width">1</se:SvgParameter> <se:SvgParameter name="stroke-linejoin">bevel</se:SvgParameter> </se:Stroke> </se:PolygonSymbolizer> </se:Rule> </se:FeatureTypeStyle> </UserStyle> </NamedLayer> </StyledLayerDescriptor>`;


export const customStyleMedina = `<?xml version="1.0" encoding="UTF-8"?> <StyledLayerDescriptor xmlns="http://www.opengis.net/sld" xsi:schemaLocation="http://www.opengis.net/sld http://schemas.opengis.net/sld/1.1.0/StyledLayerDescriptor.xsd" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:ogc="http://www.opengis.net/ogc" version="1.1.0" xmlns:se="http://www.opengis.net/se" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"> <NamedLayer> <se:Name>{{{{layername}}}}</se:Name> <UserStyle> <se:Name>custom_style_medina</se:Name> <se:FeatureTypeStyle> <se:Rule> <se:Name>Sin datos</se:Name> <se:Description> <se:Title>Sin datos</se:Title> <se:Abstract>No data</se:Abstract> </se:Description> <ogc:Filter xmlns:ogc="http://www.opengis.net/ogc"> <ogc:PropertyIsEqualTo> <ogc:PropertyName>buildings</ogc:PropertyName> <ogc:Literal>0</ogc:Literal> </ogc:PropertyIsEqualTo> </ogc:Filter> <se:PolygonSymbolizer> <se:Fill> <se:SvgParameter name="fill">#a0a0a0</se:SvgParameter> </se:Fill> <se:Stroke> <se:SvgParameter name="stroke">#6f6f6f</se:SvgParameter> <se:SvgParameter name="stroke-width">1</se:SvgParameter> <se:SvgParameter name="stroke-linejoin">bevel</se:SvgParameter> </se:Stroke> </se:PolygonSymbolizer> </se:Rule> <se:Rule> <se:Name>Daño leve</se:Name> <se:Description> <se:Title>Daño leve</se:Title> <se:Abstract>Light damage</se:Abstract> </se:Description> <ogc:Filter xmlns:ogc="http://www.opengis.net/ogc"> <ogc:And> <ogc:PropertyIsGreaterThan> <ogc:PropertyName>buildings</ogc:PropertyName> <ogc:Literal>0</ogc:Literal> </ogc:PropertyIsGreaterThan> <ogc:PropertyIsLessThan> <ogc:PropertyName>w_damage</ogc:PropertyName> <ogc:Literal>1.0</ogc:Literal> </ogc:PropertyIsLessThan> </ogc:And> </ogc:Filter> <se:PolygonSymbolizer> <se:Fill> <se:SvgParameter name="fill">#8cbaa7</se:SvgParameter> </se:Fill> <se:Stroke> <se:SvgParameter name="stroke">#729787</se:SvgParameter> <se:SvgParameter name="stroke-width">1</se:SvgParameter> <se:SvgParameter name="stroke-linejoin">bevel</se:SvgParameter> </se:Stroke> </se:PolygonSymbolizer> </se:Rule> <se:Rule> <se:Name>Daño moderado</se:Name> <se:Description> <se:Title>Daño moderado</se:Title> <se:Abstract>Moderate damage</se:Abstract> </se:Description> <ogc:Filter xmlns:ogc="http://www.opengis.net/ogc"> <ogc:And> <ogc:PropertyIsLessThanOrEqualTo> <ogc:Literal>1.0</ogc:Literal> <ogc:PropertyName>w_damage</ogc:PropertyName> </ogc:PropertyIsLessThanOrEqualTo> <ogc:PropertyIsLessThan> <ogc:PropertyName>w_damage</ogc:PropertyName> <ogc:Literal>2</ogc:Literal> </ogc:PropertyIsLessThan> </ogc:And> </ogc:Filter> <se:PolygonSymbolizer> <se:Fill> <se:SvgParameter name="fill">#e8e9ab</se:SvgParameter> </se:Fill> <se:Stroke> <se:SvgParameter name="stroke">#c4c490</se:SvgParameter> <se:SvgParameter name="stroke-width">1</se:SvgParameter> <se:SvgParameter name="stroke-linejoin">bevel</se:SvgParameter> </se:Stroke> </se:PolygonSymbolizer> </se:Rule> <se:Rule> <se:Name>Daño fuerte</se:Name> <se:Description> <se:Title>Daño fuerte</se:Title> <se:Abstract>Heavy damage</se:Abstract> </se:Description> <ogc:Filter xmlns:ogc="http://www.opengis.net/ogc"> <ogc:And> <ogc:PropertyIsLessThanOrEqualTo> <ogc:Literal>2</ogc:Literal> <ogc:PropertyName>w_damage</ogc:PropertyName> </ogc:PropertyIsLessThanOrEqualTo> <ogc:PropertyIsLessThan> <ogc:PropertyName>w_damage</ogc:PropertyName> <ogc:Literal>3</ogc:Literal> </ogc:PropertyIsLessThan> </ogc:And> </ogc:Filter> <se:PolygonSymbolizer> <se:Fill> <se:SvgParameter name="fill">#fed7aa</se:SvgParameter> </se:Fill> <se:Stroke> <se:SvgParameter name="stroke">#bfa280</se:SvgParameter> <se:SvgParameter name="stroke-width">1</se:SvgParameter> <se:SvgParameter name="stroke-linejoin">bevel</se:SvgParameter> </se:Stroke> </se:PolygonSymbolizer> </se:Rule> <se:Rule> <se:Name>Daño severo</se:Name> <se:Description> <se:Title>Daño severo</se:Title> <se:Abstract>Severe damage</se:Abstract> </se:Description> <ogc:Filter xmlns:ogc="http://www.opengis.net/ogc"> <ogc:PropertyIsLessThanOrEqualTo> <ogc:Literal>3</ogc:Literal> <ogc:PropertyName>w_damage</ogc:PropertyName> </ogc:PropertyIsLessThanOrEqualTo> </ogc:Filter> <se:PolygonSymbolizer> <se:Fill> <se:SvgParameter name="fill">#d78b8b</se:SvgParameter> </se:Fill> <se:Stroke> <se:SvgParameter name="stroke">#a86d6d</se:SvgParameter> <se:SvgParameter name="stroke-width">1</se:SvgParameter> <se:SvgParameter name="stroke-linejoin">bevel</se:SvgParameter> </se:Stroke> </se:PolygonSymbolizer> </se:Rule> </se:FeatureTypeStyle> </UserStyle> </NamedLayer> </StyledLayerDescriptor>`;


export const customStyleSuppasri = `<?xml version="1.0" encoding="UTF-8"?> <StyledLayerDescriptor xmlns="http://www.opengis.net/sld" xmlns:ogc="http://www.opengis.net/ogc" xmlns:se="http://www.opengis.net/se" xsi:schemaLocation="http://www.opengis.net/sld http://schemas.opengis.net/sld/1.1.0/StyledLayerDescriptor.xsd" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="1.1.0"> <NamedLayer> <se:Name>{{{{layername}}}}</se:Name> <UserStyle> <se:Name>custom_style_suppasri</se:Name> <se:FeatureTypeStyle> <se:Rule> <se:Name>Sin datos</se:Name> <se:Description> <se:Title>Sin datos</se:Title> <se:Abstract>No data</se:Abstract> </se:Description> <ogc:Filter xmlns:ogc="http://www.opengis.net/ogc"> <ogc:PropertyIsEqualTo> <ogc:PropertyName>buildings</ogc:PropertyName> <ogc:Literal>0</ogc:Literal> </ogc:PropertyIsEqualTo> </ogc:Filter> <se:PolygonSymbolizer> <se:Fill> <se:SvgParameter name="fill">#a0a0a0</se:SvgParameter> </se:Fill> <se:Stroke> <se:SvgParameter name="stroke">#6f6f6f</se:SvgParameter> <se:SvgParameter name="stroke-width">1</se:SvgParameter> <se:SvgParameter name="stroke-linejoin">bevel</se:SvgParameter> </se:Stroke> </se:PolygonSymbolizer> </se:Rule> <se:Rule> <se:Name>Daño leve</se:Name> <se:Description> <se:Title>Daño leve</se:Title> <se:Abstract>Light damage</se:Abstract> </se:Description> <ogc:Filter xmlns:ogc="http://www.opengis.net/ogc"> <ogc:And> <ogc:PropertyIsGreaterThan> <ogc:PropertyName>buildings</ogc:PropertyName> <ogc:Literal>0</ogc:Literal> </ogc:PropertyIsGreaterThan> <ogc:PropertyIsLessThan> <ogc:PropertyName>w_damage</ogc:PropertyName> <ogc:Literal>2</ogc:Literal> </ogc:PropertyIsLessThan> </ogc:And> </ogc:Filter> <se:PolygonSymbolizer> <se:Fill> <se:SvgParameter name="fill">#8cbaa7</se:SvgParameter> </se:Fill> <se:Stroke> <se:SvgParameter name="stroke">#729787</se:SvgParameter> <se:SvgParameter name="stroke-width">1</se:SvgParameter> <se:SvgParameter name="stroke-linejoin">bevel</se:SvgParameter> </se:Stroke> </se:PolygonSymbolizer> </se:Rule> <se:Rule> <se:Name>Daño moderado</se:Name> <se:Description> <se:Title>Daño moderado</se:Title> <se:Abstract>Moderate damage</se:Abstract> </se:Description> <ogc:Filter xmlns:ogc="http://www.opengis.net/ogc"> <ogc:And> <ogc:PropertyIsLessThanOrEqualTo> <ogc:Literal>2</ogc:Literal> <ogc:PropertyName>w_damage</ogc:PropertyName> </ogc:PropertyIsLessThanOrEqualTo> <ogc:PropertyIsLessThan> <ogc:PropertyName>w_damage</ogc:PropertyName> <ogc:Literal>3</ogc:Literal> </ogc:PropertyIsLessThan> </ogc:And> </ogc:Filter> <se:PolygonSymbolizer> <se:Fill> <se:SvgParameter name="fill">#e8e9ab</se:SvgParameter> </se:Fill> <se:Stroke> <se:SvgParameter name="stroke">#c4c490</se:SvgParameter> <se:SvgParameter name="stroke-width">1</se:SvgParameter> <se:SvgParameter name="stroke-linejoin">bevel</se:SvgParameter> </se:Stroke> </se:PolygonSymbolizer> </se:Rule> <se:Rule> <se:Name>Daño fuerte</se:Name> <se:Description> <se:Title>Daño fuerte</se:Title> <se:Abstract>Heavy damage</se:Abstract> </se:Description> <ogc:Filter xmlns:ogc="http://www.opengis.net/ogc"> <ogc:And> <ogc:PropertyIsLessThanOrEqualTo> <ogc:Literal>3</ogc:Literal> <ogc:PropertyName>w_damage</ogc:PropertyName> </ogc:PropertyIsLessThanOrEqualTo> <ogc:PropertyIsLessThan> <ogc:PropertyName>w_damage</ogc:PropertyName> <ogc:Literal>5</ogc:Literal> </ogc:PropertyIsLessThan> </ogc:And> </ogc:Filter> <se:PolygonSymbolizer> <se:Fill> <se:SvgParameter name="fill">#fed7aa</se:SvgParameter> </se:Fill> <se:Stroke> <se:SvgParameter name="stroke">#bfa280</se:SvgParameter> <se:SvgParameter name="stroke-width">1</se:SvgParameter> <se:SvgParameter name="stroke-linejoin">bevel</se:SvgParameter> </se:Stroke> </se:PolygonSymbolizer> </se:Rule> <se:Rule> <se:Name>Daño severo</se:Name> <se:Description> <se:Title>Daño severo</se:Title> <se:Abstract>Severe damage</se:Abstract> </se:Description> <ogc:Filter xmlns:ogc="http://www.opengis.net/ogc"> <ogc:PropertyIsLessThanOrEqualTo> <ogc:Literal>5</ogc:Literal> <ogc:PropertyName>w_damage</ogc:PropertyName> </ogc:PropertyIsLessThanOrEqualTo> </ogc:Filter> <se:PolygonSymbolizer> <se:Fill> <se:SvgParameter name="fill">#d78b8b</se:SvgParameter> </se:Fill> <se:Stroke> <se:SvgParameter name="stroke">#a86d6d</se:SvgParameter> <se:SvgParameter name="stroke-width">1</se:SvgParameter> <se:SvgParameter name="stroke-linejoin">bevel</se:SvgParameter> </se:Stroke> </se:PolygonSymbolizer> </se:Rule> </se:FeatureTypeStyle> </UserStyle> </NamedLayer> </StyledLayerDescriptor> `;


export const customStyleEconomic = `<?xml version="1.0" encoding="UTF-8"?> <StyledLayerDescriptor xmlns="http://www.opengis.net/sld" xmlns:ogc="http://www.opengis.net/ogc" xmlns:se="http://www.opengis.net/se" xsi:schemaLocation="http://www.opengis.net/sld http://schemas.opengis.net/sld/1.1.0/StyledLayerDescriptor.xsd" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="1.1.0"> <NamedLayer> <se:Name>{{{{layername}}}}</se:Name> <UserStyle> <se:Name>custom_style_economic</se:Name> <se:FeatureTypeStyle> <se:Rule> <se:Name>Sin datos</se:Name> <se:Description> <se:Title>Sin datos</se:Title> <se:Abstract>No data</se:Abstract> </se:Description> <ogc:Filter xmlns:ogc="http://www.opengis.net/ogc"> <ogc:PropertyIsEqualTo> <ogc:PropertyName>buildings</ogc:PropertyName> <ogc:Literal>0</ogc:Literal> </ogc:PropertyIsEqualTo> </ogc:Filter> <se:PolygonSymbolizer> <se:Fill> <se:SvgParameter name="fill">#a0a0a0</se:SvgParameter> </se:Fill> <se:Stroke> <se:SvgParameter name="stroke">#6f6f6f</se:SvgParameter> <se:SvgParameter name="stroke-width">1</se:SvgParameter> <se:SvgParameter name="stroke-linejoin">bevel</se:SvgParameter> </se:Stroke> </se:PolygonSymbolizer> </se:Rule> <se:Rule> <se:Name>&lt; 250.000 USD</se:Name> <se:Description> <se:Title>&lt; 250.000 USD</se:Title> <se:Abstract>Light damage</se:Abstract> </se:Description> <ogc:Filter xmlns:ogc="http://www.opengis.net/ogc"> <ogc:And> <ogc:PropertyIsGreaterThan> <ogc:PropertyName>buildings</ogc:PropertyName> <ogc:Literal>0</ogc:Literal> </ogc:PropertyIsGreaterThan> <ogc:PropertyIsLessThan> <ogc:PropertyName>cum_loss</ogc:PropertyName> <ogc:Literal>250000</ogc:Literal> </ogc:PropertyIsLessThan> </ogc:And> </ogc:Filter> <se:PolygonSymbolizer> <se:Fill> <se:SvgParameter name="fill">#8cbaa7</se:SvgParameter> </se:Fill> <se:Stroke> <se:SvgParameter name="stroke">#729787</se:SvgParameter> <se:SvgParameter name="stroke-width">1</se:SvgParameter> <se:SvgParameter name="stroke-linejoin">bevel</se:SvgParameter> </se:Stroke> </se:PolygonSymbolizer> </se:Rule> <se:Rule> <se:Name>&lt; 500.000 USD</se:Name> <se:Description> <se:Title>&lt; 500.000 USD</se:Title> <se:Abstract>Moderate damage</se:Abstract> </se:Description> <ogc:Filter xmlns:ogc="http://www.opengis.net/ogc"> <ogc:And> <ogc:PropertyIsLessThanOrEqualTo> <ogc:Literal>250000</ogc:Literal> <ogc:PropertyName>cum_loss</ogc:PropertyName> </ogc:PropertyIsLessThanOrEqualTo> <ogc:PropertyIsLessThan> <ogc:PropertyName>cum_loss</ogc:PropertyName> <ogc:Literal>500000</ogc:Literal> </ogc:PropertyIsLessThan> </ogc:And> </ogc:Filter> <se:PolygonSymbolizer> <se:Fill> <se:SvgParameter name="fill">#e8e9ab</se:SvgParameter> </se:Fill> <se:Stroke> <se:SvgParameter name="stroke">#c4c490</se:SvgParameter> <se:SvgParameter name="stroke-width">1</se:SvgParameter> <se:SvgParameter name="stroke-linejoin">bevel</se:SvgParameter> </se:Stroke> </se:PolygonSymbolizer> </se:Rule> <se:Rule> <se:Name>&lt; 1.000.000 USD</se:Name> <se:Description> <se:Title>&lt; 1.000.000 USD</se:Title> <se:Abstract>Heavy damage</se:Abstract> </se:Description> <ogc:Filter xmlns:ogc="http://www.opengis.net/ogc"> <ogc:And> <ogc:PropertyIsLessThanOrEqualTo> <ogc:Literal>500000</ogc:Literal> <ogc:PropertyName>cum_loss</ogc:PropertyName> </ogc:PropertyIsLessThanOrEqualTo> <ogc:PropertyIsLessThan> <ogc:PropertyName>cum_loss</ogc:PropertyName> <ogc:Literal>1000000</ogc:Literal> </ogc:PropertyIsLessThan> </ogc:And> </ogc:Filter> <se:PolygonSymbolizer> <se:Fill> <se:SvgParameter name="fill">#fed7aa</se:SvgParameter> </se:Fill> <se:Stroke> <se:SvgParameter name="stroke">#bfa280</se:SvgParameter> <se:SvgParameter name="stroke-width">1</se:SvgParameter> <se:SvgParameter name="stroke-linejoin">bevel</se:SvgParameter> </se:Stroke> </se:PolygonSymbolizer> </se:Rule> <se:Rule> <se:Name>> 1.000.000 USD</se:Name> <se:Description> <se:Title>> 1.000.000 USD</se:Title> <se:Abstract>Severe damage</se:Abstract> </se:Description> <ogc:Filter xmlns:ogc="http://www.opengis.net/ogc"> <ogc:PropertyIsLessThanOrEqualTo> <ogc:Literal>1000000</ogc:Literal> <ogc:PropertyName>cum_loss</ogc:PropertyName> </ogc:PropertyIsLessThanOrEqualTo> </ogc:Filter> <se:PolygonSymbolizer> <se:Fill> <se:SvgParameter name="fill">#d78b8b</se:SvgParameter> </se:Fill> <se:Stroke> <se:SvgParameter name="stroke">#a86d6d</se:SvgParameter> <se:SvgParameter name="stroke-width">1</se:SvgParameter> <se:SvgParameter name="stroke-linejoin">bevel</se:SvgParameter> </se:Stroke> </se:PolygonSymbolizer> </se:Rule> </se:FeatureTypeStyle> </UserStyle> </NamedLayer> </StyledLayerDescriptor> `;